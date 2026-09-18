import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { InventoryItem } from '../../types';
import { CHEMICAL_CATEGORIES, normalizeChemicalCategory } from '../../utils/chemicalCategories';
import { X, FlaskConical, CheckCircle2, Building2, MapPin, DollarSign, Layers } from 'lucide-react';
import { motion } from 'motion/react';

interface InventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: InventoryItem | null;
}

const WASHING_CHEMICAL_PRESETS = [
  { name: 'Caustic Soda Flakes (NaOH)', category: 'কাস্টিং', unit: 'kg', unitPrice: 120, minAlert: 100 },
  { name: 'Soda Ash Dense (Na2CO3)', category: 'সোডা', unit: 'kg', unitPrice: 85, minAlert: 80 },
  { name: 'Acetic Acid 99% (Glacial)', category: 'এসিড', unit: 'kg', unitPrice: 145, minAlert: 60 },
  { name: 'Oxalic Acid', category: 'এসিড', unit: 'kg', unitPrice: 180, minAlert: 30 },
  { name: 'Jute Wash Compound', category: 'জুট', unit: 'kg', unitPrice: 290, minAlert: 50 },
  { name: 'Jute Softener Flakes', category: 'জুট', unit: 'kg', unitPrice: 320, minAlert: 40 },
  { name: 'Hydrogen Peroxide 50% (H2O2)', category: 'ব্লিচিং', unit: 'kg', unitPrice: 95, minAlert: 100 },
  { name: 'Bleaching Powder High Grade', category: 'ব্লিচিং', unit: 'kg', unitPrice: 130, minAlert: 80 },
  { name: 'Potassium Permanganate (PP)', category: 'ব্লিচিং', unit: 'kg', unitPrice: 480, minAlert: 25 },
  { name: 'Sodium Hydrosulphite (Hydro)', category: 'ব্লিচিং', unit: 'kg', unitPrice: 220, minAlert: 40 },
  { name: 'Reactive Blue RGB / Navy', category: 'ব্লু', unit: 'kg', unitPrice: 720, minAlert: 20 },
  { name: 'Direct Blue Dye Fast', category: 'ব্লু', unit: 'kg', unitPrice: 580, minAlert: 25 },
  { name: 'BMB Auxiliary Agent', category: 'বিএমবি', unit: 'kg', unitPrice: 350, minAlert: 30 },
  { name: 'BMB Special Dye Fixer', category: 'বিএমবি', unit: 'kg', unitPrice: 420, minAlert: 25 },
  { name: 'Soda Bicarbonate', category: 'সোডা', unit: 'kg', unitPrice: 90, minAlert: 60 },
  { name: 'Liquid Caustic 48%', category: 'কাস্টিং', unit: 'kg', unitPrice: 110, minAlert: 70 }
];

export const InventoryItemModal: React.FC<InventoryItemModalProps> = ({
  isOpen,
  onClose,
  itemToEdit
}) => {
  const { suppliers, addInventoryItem, updateInventoryItem, updateInventoryStock, inventory, language, t } = useERP();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryItem['category']>('জুট');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [currentStock, setCurrentStock] = useState(100);
  const [unit, setUnit] = useState<InventoryItem['unit']>('kg');
  const [unitPrice, setUnitPrice] = useState(250);
  const [minAlertLevel, setMinAlertLevel] = useState(50);
  const [location, setLocation] = useState('Chemical Store');

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      setCategory(normalizeChemicalCategory(itemToEdit.category));
      setSupplierId(itemToEdit.supplierId || suppliers[0]?.id || '');
      setCurrentStock(itemToEdit.currentStockKg);
      setUnit(itemToEdit.unit);
      setUnitPrice(itemToEdit.unitPrice || (itemToEdit as any).unitCost || 250);
      setMinAlertLevel(itemToEdit.minAlertLevel || (itemToEdit as any).minimumStockKg || 50);
      setLocation(itemToEdit.location || 'Chemical Store');
    } else {
      setName('');
      setCategory('জুট');
      setSupplierId(suppliers[0]?.id || '');
      setCurrentStock(100);
      setUnit('kg');
      setUnitPrice(250);
      setMinAlertLevel(50);
      setLocation('Chemical Store');
    }
  }, [itemToEdit, suppliers]);

  if (!isOpen) return null;

  const handleSelectPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = WASHING_CHEMICAL_PRESETS.find(p => p.name === e.target.value);
    if (selected) {
      setName(selected.name);
      setCategory(selected.category as any);
      setUnit(selected.unit as any);
      setUnitPrice(selected.unitPrice);
      setMinAlertLevel(selected.minAlert);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const selectedSup = suppliers.find(s => s.id === supplierId);

    if (itemToEdit) {
      updateInventoryItem(itemToEdit.id, {
        name: name.trim(),
        category,
        supplierId: selectedSup?.id,
        supplierName: selectedSup?.company || selectedSup?.name || 'General Supply',
        currentStockKg: Number(currentStock),
        unit,
        unitPrice: Number(unitPrice),
        minAlertLevel: Number(minAlertLevel),
        location: location.trim() || 'Chemical Store'
      });
    } else {
      addInventoryItem({
        name: name.trim(),
        category,
        supplierId: selectedSup?.id,
        supplierName: selectedSup?.company || selectedSup?.name || 'General Supply',
        currentStockKg: Number(currentStock),
        unit,
        unitPrice: Number(unitPrice),
        minAlertLevel: Number(minAlertLevel),
        location: location.trim() || 'Chemical Store'
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#0F2D30]/50 backdrop-blur-xs"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#D9EAEB] overflow-hidden z-10 max-h-[90vh] flex flex-col"
      >
        <div className="p-5 bg-[#EAF7F8] border-b border-[#D9EAEB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-[#0B9FA5] flex items-center justify-center shadow-xs border border-[#0B9FA5]/20">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#17383B]">
                {itemToEdit ? t('editItemBtn') : t('addItemBtn')}
              </h3>
              <p className="text-xs text-[#688285]">
                {itemToEdit ? 'Modify chemical specifications and storage zone.' : 'Register a new dye, enzyme, acid or auxiliary.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#8EA3A5] hover:text-[#17383B] hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Chemical Presets Dropdown */}
          <div className="space-y-1.5 p-3 bg-[#F1FAFA] rounded-2xl border border-[#D9EAEB]">
            <label className="text-xs font-extrabold text-[#0B9FA5] flex items-center justify-between">
              <span>{language === 'bn' ? 'স্ট্যান্ডার্ড কেমিক্যাল ড্রপডাউন নির্বাচন' : 'Quick Chemical Preset Dropdown'}</span>
              <span className="text-[10px] text-[#688285] font-normal">{language === 'bn' ? 'ড্রপডাউন থেকে সহজে সিলেক্ট করুন' : 'Auto-fills category & unit rate'}</span>
            </label>
            <select
              onChange={handleSelectPreset}
              defaultValue=""
              className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-white border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none font-medium cursor-pointer shadow-2xs"
            >
              <option value="" disabled>{language === 'bn' ? '-- কেমিক্যাল ড্রপডাউন তালিকা হতে পছন্দ করুন --' : '-- Choose from Chemical List --'}</option>
              {WASHING_CHEMICAL_PRESETS.map(p => (
                <option key={p.name} value={p.name}>
                  [{p.category}] {p.name} — ৳{p.unitPrice}/{p.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Chemical Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#17383B]">
              Item / Chemical Name <span className="text-[#EA7185]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Reactive Red ME4BL, Cellulase Enzyme 500"
              className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none font-medium"
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17383B]">
                Category <span className="text-[#EA7185]">*</span>
              </label>
              <select
                id="chemical-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] font-semibold focus:border-[#0B9FA5] focus:outline-none"
              >
                {CHEMICAL_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>
                    {language === 'bn' ? c.bn : c.en}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17383B]">
                Packaging Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="liter">Liter (L)</option>
                <option value="drum">Drum</option>
                <option value="bag">Bag</option>
              </select>
            </div>
          </div>

          {/* Supplier & Storage Zone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#688285]">
                Supplier / Vendor
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
              >
                <option value="">{t('supplierNotAssigned')}</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.company || s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#688285]">
                Storage Zone / Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Rack A-02 Chemical Store"
                className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
              />
            </div>
          </div>

          {/* Initial Stock, Unit Price, Min Alert */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17383B]">
                Stock ({unit}) <span className="text-[#EA7185]">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={currentStock}
                onChange={(e) => setCurrentStock(Number(e.target.value))}
                className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17383B]">
                Unit Price (৳)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17383B]">
                Safety Min ({unit}) <span className="text-[#EA7185]">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={minAlertLevel}
                onChange={(e) => setMinAlertLevel(Number(e.target.value))}
                className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none font-bold"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6F0F1]">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-[#688285] hover:bg-[#F1FAFA] transition-colors"
            >
              {t('cancel')}
            </button>

            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-[#0B9FA5] hover:bg-[#088287] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{itemToEdit ? 'Save Changes' : 'Save Item'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
