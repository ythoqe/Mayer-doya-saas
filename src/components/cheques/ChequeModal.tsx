import React, { useState, useEffect } from 'react';
import { Cheque, Account, Client, Supplier, ChequeDirection, ChequeStatus } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/translation';
import { 
  FileText, 
  X, 
  CheckCircle2, 
  DollarSign, 
  Calendar, 
  Building, 
  Landmark, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface ChequeModalProps {
  isOpen: boolean;
  onClose: () => void;
  chequeToEdit?: Cheque | null;
  defaultDirection?: ChequeDirection;
}

export const ChequeModal: React.FC<ChequeModalProps> = ({ 
  isOpen, 
  onClose, 
  chequeToEdit,
  defaultDirection = 'received'
}) => {
  const { addCheque, updateCheque, endorseChequeToSupplier, cheques, clients, suppliers, accounts, language, t } = useERP();

  // Mode: 'received' (চেক গ্রহণ) or 'issued' (চেক প্রদান)
  const [direction, setDirection] = useState<ChequeDirection>(defaultDirection);

  // When 'issued': 'endorse_existing' (বিদ্যমান ক্লায়েন্টের চেক দিন) vs 'new_factory' (নিজস্ব ব্যাংক চেক)
  const [issueMode, setIssueMode] = useState<'endorse_existing' | 'new_factory'>('endorse_existing');
  const [selectedSourceChequeId, setSelectedSourceChequeId] = useState<string>('');

  // Form Fields
  const [chequeNumber, setChequeNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [customClientName, setCustomClientName] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [customSupplierName, setCustomSupplierName] = useState<string>('');
  
  const [partyName, setPartyName] = useState('');
  const [partyType, setPartyType] = useState<Cheque['partyType']>('Client');
  const [amount, setAmount] = useState<number | ''>('');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [clearingDate, setClearingDate] = useState<string>('');
  const [status, setStatus] = useState<ChequeStatus>('Pending');
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [notes, setNotes] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Filter available pending received client cheques for endorsement dropdown
  const pendingReceivedCheques = cheques.filter(
    c => (c.direction === 'received' || c.partyType === 'Client') && c.status === 'Pending' && !c.isEndorsed
  );

  useEffect(() => {
    if (chequeToEdit) {
      setDirection(chequeToEdit.direction || (chequeToEdit.partyType === 'Client' ? 'received' : 'issued'));
      setChequeNumber(chequeToEdit.chequeNumber);
      setBankName(chequeToEdit.bankName);
      setPartyName(chequeToEdit.partyName);
      setPartyType(chequeToEdit.partyType);
      setAmount(chequeToEdit.amount);
      setIssueDate(chequeToEdit.issueDate);
      setClearingDate(chequeToEdit.clearingDate || '');
      setStatus(chequeToEdit.status);
      setAccountId(chequeToEdit.accountId || accounts[0]?.id || '');
      setNotes(chequeToEdit.notes || '');

      if (chequeToEdit.clientId) setSelectedClientId(chequeToEdit.clientId);
      if (chequeToEdit.supplierId) setSelectedSupplierId(chequeToEdit.supplierId);
    } else {
      setDirection(defaultDirection);
      setIssueMode(pendingReceivedCheques.length > 0 ? 'endorse_existing' : 'new_factory');
      setChequeNumber('');
      setBankName('');
      setSelectedClientId(clients[0]?.id || '');
      setSelectedSupplierId(suppliers[0]?.id || '');
      setPartyName('');
      setPartyType(defaultDirection === 'received' ? 'Client' : 'Supplier');
      setAmount('');
      setIssueDate(new Date().toISOString().split('T')[0]);
      setClearingDate('');
      setStatus('Pending');
      setAccountId(accounts[0]?.id || '');
      setNotes('');
      setSelectedSourceChequeId(pendingReceivedCheques[0]?.id || '');

      if (defaultDirection === 'issued' && pendingReceivedCheques[0]) {
        // Preload first pending cheque
        const first = pendingReceivedCheques[0];
        setChequeNumber(first.chequeNumber);
        setBankName(first.bankName);
        setAmount(first.amount);
        setIssueDate(first.issueDate);
        setClearingDate(first.clearingDate || first.issueDate);
      }
    }
  }, [chequeToEdit, defaultDirection, isOpen]);

  // When user picks an existing cheque from dropdown in "চেক প্রদান" mode
  const handleSelectSourceCheque = (sourceId: string) => {
    setSelectedSourceChequeId(sourceId);
    const sourceChq = pendingReceivedCheques.find(c => c.id === sourceId);
    if (sourceChq) {
      setChequeNumber(sourceChq.chequeNumber);
      setBankName(sourceChq.bankName);
      setAmount(sourceChq.amount);
      setIssueDate(sourceChq.issueDate);
      setClearingDate(sourceChq.clearingDate || sourceChq.issueDate);
      setNotes(`Forwarded client cheque from ${sourceChq.partyName}`);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    if (direction === 'received') {
      // 1. RECEIVE CHEQUE FROM CLIENT
      let clientName = partyName;
      if (selectedClientId && selectedClientId !== 'other') {
        const cl = clients.find(c => c.id === selectedClientId);
        if (cl) clientName = cl.name;
      } else if (customClientName.trim()) {
        clientName = customClientName.trim();
      }

      if (!clientName) clientName = 'Client';

      if (chequeToEdit) {
        await updateCheque(chequeToEdit.id, {
          chequeNumber: chequeNumber.trim(),
          bankName: bankName.trim() || 'General Bank',
          partyName: clientName,
          partyType: 'Client',
          direction: 'received',
          clientId: selectedClientId !== 'other' ? selectedClientId : undefined,
          clientName,
          amount: Number(amount),
          issueDate,
          clearingDate: clearingDate || issueDate,
          status,
          accountId: accountId || undefined,
          notes: notes.trim() || undefined
        });
      } else {
        await addCheque({
          chequeNumber: chequeNumber.trim(),
          bankName: bankName.trim() || 'General Bank',
          partyName: clientName,
          partyType: 'Client',
          direction: 'received',
          clientId: selectedClientId !== 'other' ? selectedClientId : undefined,
          clientName,
          amount: Number(amount),
          issueDate,
          clearingDate: clearingDate || issueDate,
          status,
          accountId: accountId || undefined,
          notes: notes.trim() || undefined
        });
      }
    } else {
      // 2. ISSUE CHEQUE TO SUPPLIER
      let supplierName = partyName;
      if (selectedSupplierId && selectedSupplierId !== 'other') {
        const sup = suppliers.find(s => s.id === selectedSupplierId);
        if (sup) supplierName = sup.name;
      } else if (customSupplierName.trim()) {
        supplierName = customSupplierName.trim();
      }
      if (!supplierName) supplierName = 'Supplier';

      if (issueMode === 'endorse_existing' && selectedSourceChequeId && !chequeToEdit) {
        // Use endorse workflow
        await endorseChequeToSupplier(
          selectedSourceChequeId, 
          selectedSupplierId !== 'other' ? selectedSupplierId : `sup-${Date.now()}`, 
          supplierName, 
          notes.trim() || undefined
        );
      } else {
        // Direct factory issued cheque
        if (chequeToEdit) {
          await updateCheque(chequeToEdit.id, {
            chequeNumber: chequeNumber.trim(),
            bankName: bankName.trim() || 'Factory Bank',
            partyName: supplierName,
            partyType: 'Supplier',
            direction: 'issued',
            supplierId: selectedSupplierId !== 'other' ? selectedSupplierId : undefined,
            supplierName,
            amount: Number(amount),
            issueDate,
            clearingDate: clearingDate || issueDate,
            status,
            accountId: accountId || undefined,
            notes: notes.trim() || undefined
          });
        } else {
          await addCheque({
            chequeNumber: chequeNumber.trim(),
            bankName: bankName.trim() || 'Factory Bank',
            partyName: supplierName,
            partyType: 'Supplier',
            direction: 'issued',
            supplierId: selectedSupplierId !== 'other' ? selectedSupplierId : undefined,
            supplierName,
            amount: Number(amount),
            issueDate,
            clearingDate: clearingDate || issueDate,
            status,
            accountId: accountId || undefined,
            notes: notes.trim() || undefined
          });
        }
      }
    }

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17383B]/40 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#D9EAEB] overflow-hidden my-6"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#F1FAFA] to-[#E5F8F1] border-b border-[#D9EAEB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${direction === 'received' ? 'bg-gradient-to-br from-[#0B9FA5] to-[#16B8B0]' : 'bg-gradient-to-br from-[#6357E8] to-[#4838D1]'} text-white flex items-center justify-center shadow-xs shrink-0`}>
              {direction === 'received' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#17383B]">
                {chequeToEdit 
                  ? (language === 'bn' ? 'চেক সম্পাদনা' : 'Edit Cheque')
                  : direction === 'received'
                  ? (language === 'bn' ? 'চেক গ্রহণ এন্ট্রি (ক্লায়েন্ট)' : 'Receive Cheque from Client')
                  : (language === 'bn' ? 'চেক প্রদান এন্ট্রি (সাপ্লায়ার)' : 'Issue / Forward Cheque to Supplier')}
              </h3>
              <p className="text-xs text-[#688285]">
                {direction === 'received'
                  ? (language === 'bn' ? 'ক্লায়েন্ট থেকে প্রাপ্ত চেক সিস্টেমে যুক্ত করুন' : 'Record client inward cheque')
                  : (language === 'bn' ? 'সাপ্লায়ার বা মহাজনকে ক্লায়েন্টের চেক দিন বা নিজস্ব চেক ইস্যু করুন' : 'Assign client cheque or issue company cheque to supplier')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/80 text-[#8EA3A5] hover:text-[#17383B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#E5F8F1] text-[#229A73] flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-black text-lg text-[#17383B]">
                {direction === 'received'
                  ? (language === 'bn' ? 'চেক গ্রহণ সফলভাবে সম্পন্ন হয়েছে!' : 'Cheque Received Successfully!')
                  : (language === 'bn' ? 'চেক প্রদান সফলভাবে সম্পন্ন হয়েছে!' : 'Cheque Issued/Endorsed Successfully!')}
              </h4>
              <p className="text-xs text-[#688285]">
                Cheque #{chequeNumber} • {formatCurrency(Number(amount) || 0, language)}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Top Direction Switcher (চেক গ্রহণ vs চেক প্রদান) */}
              {!chequeToEdit && (
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#F1FAFA] rounded-xl border border-[#D9EAEB]">
                  <button
                    type="button"
                    onClick={() => {
                      setDirection('received');
                      setPartyType('Client');
                    }}
                    className={`py-2.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                      direction === 'received'
                        ? 'bg-white text-[#0B9FA5] shadow-xs border border-[#D9EAEB]'
                        : 'text-[#688285] hover:text-[#17383B]'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    {language === 'bn' ? '📥 ১. চেক গ্রহণ (Client)' : '📥 Receive Cheque'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDirection('issued');
                      setPartyType('Supplier');
                    }}
                    className={`py-2.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                      direction === 'issued'
                        ? 'bg-white text-[#6357E8] shadow-xs border border-[#D9EAEB]'
                        : 'text-[#688285] hover:text-[#17383B]'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    {language === 'bn' ? '📤 ২. চেক প্রদান (Supplier)' : '📤 Give Cheque'}
                  </button>
                </div>
              )}

              {/* In "চেক প্রদান" Mode: Choose between Forwarding Existing Client Cheque vs Factory Direct Cheque */}
              {direction === 'issued' && !chequeToEdit && (
                <div className="p-3.5 rounded-xl bg-[#EEEBFF]/60 border border-[#D1CAFF] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#382BB8] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      {language === 'bn' ? 'চেক প্রদানের মাধ্যম নির্বাচন করুন:' : 'Cheque Assignment Method:'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIssueMode('endorse_existing')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        issueMode === 'endorse_existing'
                          ? 'bg-white border-[#6357E8] text-[#17383B] shadow-2xs font-extrabold ring-1 ring-[#6357E8]'
                          : 'bg-white/60 border-[#D9EAEB] text-[#688285] hover:bg-white'
                      }`}
                    >
                      <div className="font-bold text-[#6357E8] mb-0.5">
                        {language === 'bn' ? '✓ বিদ্যমান ক্লায়েন্টের চেক দিন' : '✓ Forward Client Cheque'}
                      </div>
                      <div className="text-[10px] text-[#688285]">
                        {language === 'bn' ? 'ড্রপডাউন থেকে প্রাপ্ত পেন্ডিং চেক সিলেক্ট করুন' : 'Pick from received client cheques'}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIssueMode('new_factory')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        issueMode === 'new_factory'
                          ? 'bg-white border-[#6357E8] text-[#17383B] shadow-2xs font-extrabold ring-1 ring-[#6357E8]'
                          : 'bg-white/60 border-[#D9EAEB] text-[#688285] hover:bg-white'
                      }`}
                    >
                      <div className="font-bold text-[#17383B] mb-0.5">
                        {language === 'bn' ? 'ফ্যাক্টরির নিজস্ব চেক ইস্যু' : 'Direct Company Cheque'}
                      </div>
                      <div className="text-[10px] text-[#688285]">
                        {language === 'bn' ? 'কারখানার ব্যাংক একাউন্ট থেকে সরাসরি চেক' : 'Direct from factory bank account'}
                      </div>
                    </button>
                  </div>

                  {/* Dropdown of Existing Client Cheques */}
                  {issueMode === 'endorse_existing' && (
                    <div className="pt-2 border-t border-[#D1CAFF]">
                      <label className="block text-xs font-black text-[#17383B] mb-1.5">
                        {language === 'bn' ? 'বিদ্যমান প্রাপ্ত চেক সিলেক্ট করুন (ড্রপডাউন)' : 'Select Received Client Cheque from List'} *
                      </label>
                      {pendingReceivedCheques.length === 0 ? (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                          {language === 'bn' 
                            ? 'বর্তমানে কোনো পেন্ডিং প্রাপ্ত ক্লায়েন্টের চেক নেই। অনুগ্রহ করে প্রথমে "চেক গ্রহণ" করুন অথবা নিজস্ব চেক ইস্যু করুন।' 
                            : 'No pending received cheques available to forward.'}
                        </div>
                      ) : (
                        <select
                          value={selectedSourceChequeId}
                          onChange={(e) => handleSelectSourceCheque(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-[#6357E8] bg-white text-xs font-bold text-[#17383B] focus:outline-none"
                          required
                        >
                          <option value="">{language === 'bn' ? '-- ড্রপডাউন থেকে চেক নির্বাচন করুন --' : '-- Select Cheque --'}</option>
                          {pendingReceivedCheques.map(chq => (
                            <option key={chq.id} value={chq.id}>
                              [#{chq.chequeNumber}] {chq.partyName} - {chq.bankName} - {formatCurrency(chq.amount, language)} (ইস্যু: {chq.issueDate})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Party Selection: Client or Supplier */}
              {direction === 'received' ? (
                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'প্রদানকারী গ্রাহক / ক্লায়েন্ট' : 'Client / Customer Name'} *
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.companyName || c.name}) - বকেয়া: {formatCurrency(c.balance, language)}
                      </option>
                    ))}
                    <option value="other">{language === 'bn' ? '+ নতুন ক্লায়েন্ট নাম লিখুন' : '+ Other / Custom Client'}</option>
                  </select>

                  {selectedClientId === 'other' && (
                    <input
                      type="text"
                      placeholder="e.g. Apex Apparels Ltd"
                      value={customClientName}
                      onChange={(e) => setCustomClientName(e.target.value)}
                      className="mt-2 w-full px-3 py-2 rounded-xl border border-[#D9EAEB] bg-white text-xs text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                      required
                    />
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'প্রাপক মহাজন / সাপ্লায়ার' : 'Recipient Supplier'} *
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-bold text-[#17383B] focus:border-[#6357E8] focus:outline-none"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category}) - বকেয়া: {formatCurrency(s.balance, language)}
                      </option>
                    ))}
                    <option value="other">{language === 'bn' ? '+ নতুন মহাজনের নাম লিখুন' : '+ Other / Custom Supplier'}</option>
                  </select>

                  {selectedSupplierId === 'other' && (
                    <input
                      type="text"
                      placeholder="e.g. Huntsman Textile Dyes"
                      value={customSupplierName}
                      onChange={(e) => setCustomSupplierName(e.target.value)}
                      className="mt-2 w-full px-3 py-2 rounded-xl border border-[#D9EAEB] bg-white text-xs text-[#17383B] focus:border-[#6357E8] focus:outline-none"
                      required
                    />
                  )}
                </div>
              )}

              {/* Cheque No & Bank */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'চেক নম্বর' : 'Cheque Number'} *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CQ-984210"
                    value={chequeNumber}
                    onChange={(e) => setChequeNumber(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-mono font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'ড্রয়ার ব্যাংক' : 'Drawer Bank'} *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sonali Bank Ltd, Islami Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-medium text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Amount & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'চেকের পরিমাণ (৳)' : 'Cheque Amount (BDT)'} *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8EA3A5]">৳</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'চেকের স্ট্যাটাস' : 'Cheque Status'}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ChequeStatus)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-bold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                  >
                    <option value="Pending">{language === 'bn' ? '⏳ Pending (অপেক্ষমাণ)' : 'Pending'}</option>
                    <option value="Clear">{language === 'bn' ? '✓ Clear (ক্লিয়ারড / জমাকৃত)' : 'Clear'}</option>
                    <option value="Cancel">{language === 'bn' ? '✕ Cancel (বাতিল)' : 'Cancel'}</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'ইস্যু তারিখ' : 'Issue Date'}
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'ক্লিয়ারিং / জমার সম্ভাব্য তারিখ' : 'Expected Clearing Date'}
                  </label>
                  <input
                    type="date"
                    value={clearingDate}
                    onChange={(e) => setClearingDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                  />
                </div>
              </div>

              {/* Linked Account */}
              {direction === 'received' && (
                <div>
                  <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                    {language === 'bn' ? 'জমার ব্যাংক একাউন্ট (ক্লিয়ার হলে জমা হবে)' : 'Deposit Bank Account'}
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-medium text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                  >
                    <option value="">{language === 'bn' ? 'কোনো একাউন্ট নির্দিষ্ট নয়' : 'None Selected'}</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName} ({acc.bankName || acc.accountType}) - ব্যালেন্স: {formatCurrency(acc.currentBalance, language)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-extrabold text-[#17383B] mb-1.5">
                  {language === 'bn' ? 'নোট / চালান বা লট রেফারেন্স' : 'Notes / Remarks'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'যেমন: চালান নং #১০২৪ এর বিল বা বিশেষ বিবরণ' : 'e.g. Payment for Batch #1024'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
                />
              </div>

              {/* Interactive Info Footer */}
              {direction === 'issued' && issueMode === 'endorse_existing' && (
                <div className="p-3 rounded-xl bg-[#E5F8F1] border border-[#38C99A]/30 text-[11px] text-[#176B52] leading-relaxed">
                  ✓ <strong>{language === 'bn' ? 'অটোমেটেড লিঙ্কড ট্র্যাকিং:' : 'Automated Linked Tracking:'}</strong> {language === 'bn' ? 'মহাজন কর্তৃক চেক থেকে টাকা উত্তোলন ও স্ট্যাটাস Clear হলে ক্লায়েন্টের মূল চেকটিও ক্লিয়ার হয়ে যাবে এবং উভয়ের বকেয়া সমন্বয় হবে।' : 'When supplier clears this cheque, the original client cheque clears automatically.'}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9EAEB]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-[#D9EAEB] text-xs font-extrabold text-[#688285] hover:bg-[#F1FAFA]"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-black shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 ${
                    direction === 'received' 
                      ? 'bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5]' 
                      : 'bg-gradient-to-r from-[#6357E8] to-[#4838D1] hover:from-[#5144D3] hover:to-[#3C2BBF]'
                  }`}
                >
                  {direction === 'received' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  {chequeToEdit 
                    ? (language === 'bn' ? 'আপডেট সংরক্ষণ করুন' : 'Save Changes')
                    : direction === 'received'
                    ? (language === 'bn' ? 'চেক গ্রহণ এন্ট্রি নিশ্চিত করুন' : 'Confirm Receive Cheque')
                    : (language === 'bn' ? 'চেক প্রদান নিশ্চিত করুন' : 'Confirm Issue/Forward Cheque')}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
