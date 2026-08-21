import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { X, Plus, Package, Receipt, DollarSign, FlaskConical, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const QuickActionModal: React.FC = () => {
  const { 
    quickActionModal, 
    openQuickAction, 
    clients, 
    accounts, 
    addOrder, 
    addExpense, 
    addInventoryItem,
    t, 
    language 
  } = useERP();

  // Sub-form states
  const [activeTab, setActiveTab] = useState<'order' | 'expense' | 'chemical'>(
    quickActionModal === 'expense' ? 'expense' : quickActionModal === 'chemical' ? 'chemical' : 'order'
  );

  // New Order Form
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [fabricQuality, setFabricQuality] = useState('মার্কিন');
  const [colorShade, setColorShade] = useState('');
  const [greyYards, setGreyYards] = useState(1000);
  const [finishingYards, setFinishingYards] = useState(0);
  const [unitRate, setUnitRate] = useState(40);
  const [advanceAmount, setAdvanceAmount] = useState(10000);
  const [deliveryDate, setDeliveryDate] = useState(new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]);

  // New Expense Form
  const [expCategory, setExpCategory] = useState<'Gas' | 'Electricity' | 'Maintenance' | 'Chemicals' | 'Labor' | 'Misc'>('Maintenance');
  const [expAmount, setExpAmount] = useState(5000);
  const [expAccountId, setExpAccountId] = useState(accounts[0]?.id || '');
  const [expPaidBy, setExpPaidBy] = useState('');
  const [expNotes, setExpNotes] = useState('');

  // New Chemical Form
  const [chemName, setChemName] = useState('');
  const [chemCategory, setChemCategory] = useState<'Acid' | 'Enzyme' | 'Dye' | 'Softener' | 'Bleach' | 'Alkali'>('Enzyme');
  const [chemStock, setChemStock] = useState(100);
  const [chemPrice, setChemPrice] = useState(250);
  const [chemAlert, setChemAlert] = useState(50);

  if (!quickActionModal) return null;

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedClient = clients.find(c => c.id === clientId) || clients[0];
    const billable = Number(finishingYards) > 0 ? Number(finishingYards) : Number(greyYards);
    const total = Math.round(billable * Number(unitRate));
    const due = Math.max(0, total - Number(advanceAmount));

    addOrder({
      orderNumber: `MD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      clientId: selectedClient?.id || 'c1',
      clientName: selectedClient?.companyName || 'Mayer Doya Fabrics',
      fabricQuality,
      washType: fabricQuality,
      colorShade: colorShade || 'Standard Wash',
      greyYards: Number(greyYards),
      finishingYards: Number(finishingYards) || 0,
      quantityPcs: billable,
      quantityYards: billable,
      unitRate: Number(unitRate),
      totalAmount: total,
      advanceAmount: Number(advanceAmount),
      dueAmount: due,
      status: 'pending',
      receivedDate: new Date().toISOString().split('T')[0],
      deliveryDate: deliveryDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      priority: 'normal',
      batchNumber: `BATCH-W-${Math.floor(10 + Math.random() * 90)}`
    });

    openQuickAction(null);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedAccount = accounts.find(a => a.id === expAccountId) || accounts[0];

    addExpense({
      voucherNo: `VOUCH-26-${Math.floor(1000 + Math.random() * 9000)}`,
      category: expCategory,
      amount: Number(expAmount),
      date: new Date().toISOString().split('T')[0],
      accountId: selectedAccount?.id || 'acc-1',
      accountName: selectedAccount?.accountName || 'Primary Account',
      paidBy: expPaidBy || 'Accounts Desk',
      notes: expNotes || 'Factory operational expense'
    });

    openQuickAction(null);
  };

  const handleCreateChemical = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chemName) return;

    addInventoryItem({
      name: chemName,
      category: chemCategory,
      currentStockKg: Number(chemStock),
      unit: 'kg',
      unitPrice: Number(chemPrice),
      minAlertLevel: Number(chemAlert),
      location: 'Rack Chemical Store'
    });

    openQuickAction(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17383B]/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl bg-white rounded-[26px] border border-[#D9EAEB] shadow-[0_20px_60px_rgba(23,56,59,0.18)] overflow-hidden"
        >
          {/* Top Bar */}
          <div className="px-6 py-5 border-b border-[#E6F0F1] flex items-center justify-between bg-[#F1FAFA]/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0B9FA5] text-white flex items-center justify-center font-bold text-sm shadow-[0_2px_10px_rgba(11,159,165,0.25)]">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#17383B] text-base">{t('quickNew')}</h3>
                <p className="text-xs text-[#688285]">Create instant factory entries</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openQuickAction(null)}
              className="p-2 rounded-full hover:bg-white text-[#8EA3A5] hover:text-[#17383B] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Segmented Switcher */}
          <div className="p-4 px-6 bg-white border-b border-[#E6F0F1]">
            <div className="grid grid-cols-3 gap-2 p-1 bg-[#EAF6F7] rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('order')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'order' 
                    ? 'bg-white text-[#0B9FA5] shadow-sm font-bold' 
                    : 'text-[#688285] hover:text-[#17383B]'
                }`}
              >
                <Package className="w-4 h-4" />
                {t('newOrder')}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('expense')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'expense' 
                    ? 'bg-white text-[#0B9FA5] shadow-sm font-bold' 
                    : 'text-[#688285] hover:text-[#17383B]'
                }`}
              >
                <Receipt className="w-4 h-4" />
                {t('newExpense')}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('chemical')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'chemical' 
                    ? 'bg-white text-[#0B9FA5] shadow-sm font-bold' 
                    : 'text-[#688285] hover:text-[#17383B]'
                }`}
              >
                <FlaskConical className="w-4 h-4" />
                {t('newChemical')}
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {activeTab === 'order' && (
              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#17383B] mb-1">{t('clientCompany')}</label>
                    <select
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                    >
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.companyName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17383B] mb-1">
                      {language === 'bn' ? 'কাপড়ের কোয়ালিটি' : 'Fabric Quality'}
                    </label>
                    <select
                      value={fabricQuality}
                      onChange={(e) => setFabricQuality(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                    >
                      <option value="মার্কিন">মার্কিন (Markin)</option>
                      <option value="লংক্লথ">লংক্লথ (Longcloth)</option>
                      <option value="ভয়েল">ভয়েল (Voile)</option>
                      <option value="পপলিন">পপলিন (Poplin)</option>
                      <option value="ইউনিটিকা">ইউনিটিকা (Unitika)</option>
                      <option value="আস্তর">আস্তর (Astor / Lining)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#17383B] mb-1">
                      {language === 'bn' ? 'কালার / শেড' : 'Color / Target Shade'}
                    </label>
                    <input
                      type="text"
                      placeholder={language === 'bn' ? 'যেমন: সাদা, নেভি ব্লু, ব্ল্যাক' : 'e.g. White, Navy Blue, Black'}
                      value={colorShade}
                      onChange={(e) => setColorShade(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17383B] mb-1">{t('deliveryDateLabel')}</label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Yardage & Financial Inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F1FAFA]/60 p-3.5 rounded-xl border border-[#D9EAEB]">
                  <div>
                    <label className="block text-[11px] font-bold text-[#17383B] mb-1">
                      {language === 'bn' ? '১. গেরে গজ' : '1. Grey Gaze (Yds)'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={greyYards}
                      onChange={(e) => setGreyYards(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#D9EAEB] bg-white text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#0B9FA5] mb-1">
                      {language === 'bn' ? '২. ফিনিশিং গজ' : '2. Finishing Gaze'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={finishingYards}
                      onChange={(e) => setFinishingYards(Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 rounded-lg border-2 border-[#0B9FA5]/50 bg-white text-xs font-black text-[#0B9FA5] focus:border-[#0B9FA5] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#17383B] mb-1">
                      {language === 'bn' ? 'দর (৳/গজ)' : 'Rate (৳/Yd)'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={unitRate}
                      onChange={(e) => setUnitRate(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#D9EAEB] bg-white text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#229A73] mb-1">
                      {language === 'bn' ? 'অগ্রিম (৳)' : 'Advance (৳)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#D9EAEB] bg-white text-xs font-bold text-[#229A73] focus:border-[#229A73] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 bg-[#EAF6F7] rounded-xl flex items-center justify-between text-xs">
                  <span className="text-[#688285]">
                    {language === 'bn' ? 'হিসাবকৃত মোট বিল:' : 'Total Bill:'}{' '}
                    <strong className="text-[#17383B]">৳{Math.round(((finishingYards > 0 ? finishingYards : greyYards) * unitRate)).toLocaleString()}</strong>
                  </span>
                  <span className="text-[#688285]">
                    {language === 'bn' ? 'মোট বাকি:' : 'Net Due:'}{' '}
                    <strong className="text-[#0B9FA5]">৳{Math.max(0, Math.round(((finishingYards > 0 ? finishingYards : greyYards) * unitRate)) - advanceAmount).toLocaleString()}</strong>
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white font-bold text-xs tracking-wide shadow-[0_4px_15px_rgba(11,159,165,0.25)] transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {language === 'bn' ? 'অর্ডার বুকিং সংরক্ষণ করুন' : 'Save & Book Job Card'}
                </button>
              </form>
            )}

            {activeTab === 'expense' && (
              <form onSubmit={handleCreateExpense} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#17383B] mb-1">Expense Category</label>
                    <select
                      value={expCategory}
                      onChange={(e) => setExpCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                    >
                      <option value="Gas">Gas (Boiler Line)</option>
                      <option value="Electricity">Electricity (DESCO/DPDC)</option>
                      <option value="Maintenance">Machine Spare & Maintenance</option>
                      <option value="Chemicals">Spot Chemical Purchase</option>
                      <option value="Fuel/Boiler">Boiler Wood / Husk</option>
                      <option value="Labor">Daily Casual Labor</option>
                      <option value="Misc">Miscellaneous / Food</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17383B] mb-1">Amount (BDT ৳)</label>
                    <input
                      type="number"
                      min="1"
                      value={expAmount}
                      onChange={(e) => setExpAmount(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs font-bold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#17383B] mb-1">Paid From Account</label>
                    <select
                      value={expAccountId}
                      onChange={(e) => setExpAccountId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                    >
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.accountName} (Bal: ৳{a.currentBalance.toLocaleString()})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17383B] mb-1">Recipient / Paid To</label>
                    <input
                      type="text"
                      placeholder="e.g. Titas Gas / Maintenance Technician"
                      value={expPaidBy}
                      onChange={(e) => setExpPaidBy(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17383B] mb-1">Description / Voucher Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Provide details about the expenditure..."
                    value={expNotes}
                    onChange={(e) => setExpNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white font-bold text-xs tracking-wide shadow-[0_4px_15px_rgba(11,159,165,0.25)] transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  Log Expense Voucher
                </button>
              </form>
            )}

            {activeTab === 'chemical' && (
              <form onSubmit={handleCreateChemical} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#17383B] mb-1">Chemical / Dye Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Reactive Red ME4B"
                      value={chemName}
                      onChange={(e) => setChemName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17383B] mb-1">Category</label>
                    <select
                      value={chemCategory}
                      onChange={(e) => setChemCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                    >
                      <option value="Enzyme">Enzyme</option>
                      <option value="Acid">Acid</option>
                      <option value="Dye">Dye / Colorant</option>
                      <option value="Softener">Softener</option>
                      <option value="Bleach">Bleach / Oxidizer</option>
                      <option value="Alkali">Alkali (Soda Ash)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#17383B] mb-1">Initial Stock (Kg)</label>
                    <input
                      type="number"
                      min="1"
                      value={chemStock}
                      onChange={(e) => setChemStock(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17383B] mb-1">Unit Price (৳/Kg)</label>
                    <input
                      type="number"
                      min="1"
                      value={chemPrice}
                      onChange={(e) => setChemPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17383B] mb-1">Low Alert (Kg)</label>
                    <input
                      type="number"
                      min="1"
                      value={chemAlert}
                      onChange={(e) => setChemAlert(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white font-bold text-xs tracking-wide shadow-[0_4px_15px_rgba(11,159,165,0.25)] transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  <FlaskConical className="w-4 h-4" />
                  Save Chemical Item
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
