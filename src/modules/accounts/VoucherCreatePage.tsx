import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useUIStore } from '../../stores/ui.store';

type FormState = {
  // Voucher Info
  party: string;
  type: string;
  date: string;
  voucher: string;
  remarks: string;

  // Metal Details
  gross: string;
  purity: string;
  fine: string;
  rateCut: string;
  netFine: string;

  // Manufacturing Info (optional)
  wastage: string;
  fineAfterWastage: string;

  // Stone Details (optional)
  stoneWt: string;
  stoneRate: string;
  stoneAmount: string;

  // Charges (optional)
  hallmark: string;
  taxes: string;
  total: string;

  // Settlement Preview
  previous: string;
  entry: string;
  newBalance: string;
};

function toNum(v: string): number {
  const n = Number(String(v ?? '').trim());
  return Number.isFinite(n) ? n : 0;
}

export default function CustomerMetalLedgerPage() {
  const isDarkMode = useUIStore((s) => s.isDarkMode);

  const [s, setS] = useState<FormState>(() => ({
    party: '',
    type: '',
    date: new Date().toISOString().slice(0, 10),
    voucher: '',
    remarks: '',

    gross: '',
    purity: '',
    fine: '',
    rateCut: '',
    netFine: '',

    wastage: '',
    fineAfterWastage: '',

    stoneWt: '',
    stoneRate: '',
    stoneAmount: '',

    hallmark: '',
    taxes: '',
    total: '',

    previous: '',
    entry: '',
    newBalance: '',
  }));

  const derived = useMemo(() => {
    const gross = toNum(s.gross);
    const purity = toNum(s.purity);
    const rateCut = toNum(s.rateCut);

    const fine = gross * (purity / 100);
    const netFine = fine - rateCut;

    const wastage = toNum(s.wastage);
    const fineAfterWastage = netFine - wastage;

    const stoneAmount = toNum(s.stoneWt) * toNum(s.stoneRate);

    const total = toNum(s.hallmark) + toNum(s.taxes);

    const newBalance = toNum(s.previous) + toNum(s.entry);

    return {
      fine: fine ? fine.toFixed(3) : '',
      netFine: netFine ? netFine.toFixed(3) : '',
      fineAfterWastage: fineAfterWastage ? fineAfterWastage.toFixed(3) : '',
      stoneAmount: stoneAmount ? stoneAmount.toFixed(2) : '',
      total: total ? total.toFixed(2) : '',
      newBalance: newBalance ? newBalance.toFixed(2) : '',
    };
  }, [
    s.gross,
    s.purity,
    s.rateCut,
    s.wastage,
    s.stoneWt,
    s.stoneRate,
    s.hallmark,
    s.taxes,
    s.previous,
    s.entry,
  ]);

  const set = (k: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setS((p) => ({ ...p, [k]: v }));
  };

  const inputBase =
    'w-full px-4 py-2.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2';

  const inputClass = `${inputBase} ${
    isDarkMode
      ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
  }`;

  const readOnlyClass = `${inputBase} ${
    isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-gray-100 border-gray-200 text-gray-900'
  }`;

  const labelClass = `block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;

  const sectionClass = `border rounded-lg p-4 ${
    isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
  }`;

  const sectionTitleClass = `text-lg font-semibold mb-4 pb-2 border-b ${
    isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
  }`;

  const handleSave = (e: FormEvent) => {
    e.preventDefault();

    // For now: just shows what will be sent. Replace with API call later.
    const payload = {
      ...s,
      fine: derived.fine,
      netFine: derived.netFine,
      fineAfterWastage: derived.fineAfterWastage,
      stoneAmount: derived.stoneAmount,
      total: derived.total,
      newBalance: derived.newBalance,
    };

    // eslint-disable-next-line no-console
    console.log('[CustomerMetalLedger] payload:', payload);
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Customer Metal Ledger
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Enter customer metal ledger details and save.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className={`p-6 rounded-xl border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        <div className="space-y-6">
          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>Voucher Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>Party</label>
                <input className={inputClass} value={s.party} onChange={set('party')} placeholder="Party" />
              </div>

              <div>
                <label className={labelClass}>Type</label>
                <input className={inputClass} value={s.type} onChange={set('type')} placeholder="Type" />
              </div>
              <div>
                <label className={labelClass}>Date</label>
                <input className={inputClass} type="date" value={s.date} onChange={set('date')} />
              </div>
              <div>
                <label className={labelClass}>Voucher</label>
                <input className={inputClass} value={s.voucher} onChange={set('voucher')} placeholder="Voucher No" />
              </div>
              <div className="md:col-span-2 lg:col-span-4">
                <label className={labelClass}>Remarks</label>
                <input className={inputClass} value={s.remarks} onChange={set('remarks')} placeholder="Remarks" />
              </div>
            </div>
          </div>

          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>Metal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className={labelClass}>Gross</label>
                <input className={inputClass} value={s.gross} onChange={set('gross')} placeholder="Gross" />
              </div>
              <div>
                <label className={labelClass}>Purity</label>
                <input className={inputClass} value={s.purity} onChange={set('purity')} placeholder="Purity" />
              </div>
              <div>
                <label className={labelClass}>Fine</label>
                <input className={readOnlyClass} value={derived.fine} readOnly />
              </div>
              <div>
                <label className={labelClass}>Rate Cut</label>
                <input className={inputClass} value={s.rateCut} onChange={set('rateCut')} placeholder="Rate Cut" />
              </div>
              <div>
                <label className={labelClass}>Net Fine</label>
                <input className={readOnlyClass} value={derived.netFine} readOnly />
              </div>
            </div>
          </div>

          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>Manufacturing Info (optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Wastage</label>
                <input className={inputClass} value={s.wastage} onChange={set('wastage')} placeholder="Wastage" />
              </div>
              <div>
                <label className={labelClass}>Fine After Wastage</label>
                <input className={readOnlyClass} value={derived.fineAfterWastage} readOnly />
              </div>
            </div>
          </div>

          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>Stone Details (optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Stone Wt</label>
                <input className={inputClass} value={s.stoneWt} onChange={set('stoneWt')} placeholder="Stone Wt" />
              </div>
              <div>
                <label className={labelClass}>Rate</label>
                <input className={inputClass} value={s.stoneRate} onChange={set('stoneRate')} placeholder="Rate" />
              </div>
              <div>
                <label className={labelClass}>Amount</label>
                <input className={readOnlyClass} value={derived.stoneAmount} readOnly />
              </div>
            </div>
          </div>

          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>Charges (optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Hallmark</label>
                <input className={inputClass} value={s.hallmark} onChange={set('hallmark')} placeholder="Hallmark" />
              </div>
              <div>
                <label className={labelClass}>Taxes</label>
                <input className={inputClass} value={s.taxes} onChange={set('taxes')} placeholder="Taxes" />
              </div>
              <div>
                <label className={labelClass}>Total</label>
                <input className={readOnlyClass} value={derived.total} readOnly />
              </div>
            </div>
          </div>

          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>Settlement Preview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Previous</label>
                <input className={inputClass} value={s.previous} onChange={set('previous')} placeholder="Previous" />
              </div>
              <div>
                <label className={labelClass}>Entry</label>
                <input className={inputClass} value={s.entry} onChange={set('entry')} placeholder="Entry" />
              </div>
              <div>
                <label className={labelClass}>New Balance</label>
                <input className={readOnlyClass} value={derived.newBalance} readOnly />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-lg font-semibold text-sm shadow-md ${
                isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}