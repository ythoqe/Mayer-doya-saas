import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { InventoryItem } from '../../types';
import { X, FlaskConical, CheckCircle2, Building2, MapPin, DollarSign, Layers } from 'lucide-react';
import { motion } from 'motion/react';

interface InventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: InventoryItem | null;
}

export const InventoryItemModal: React.FC<InventoryItemModalProps> = ({
  isOpen,
  onClose,
  itemToEdit
}) => {
  const { suppliers, addInventoryItem, updateInventoryStock, inventory, t } = useERP();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryItem['category']>('Enzyme');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [currentStock, setCurrentStock] = useState(100);
  const [unit, setUnit] = useState<InventoryItem['unit']>('kg');
  const [unitPrice, setUnitPrice] = useState(250);
  const [minAlertLevel, setMinAlertLevel] = useState(50);
  const [location, setLocation] = useState('Chemical Store');

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      setCategory(itemToEdit.category);
      setSupplierId(itemToEdit.supplierId || suppliers[0]?.id || '');
      setCurrentStock(itemToEdit.currentStockKg);
      setUnit(itemToEdit.unit);
      setUnitPrice(itemToEdit.unitPrice);
      setMinAlertLevel(itemToEdit.minAlertLevel);
      setLocation(itemToEdit.location || 'Chemical Store');
    } else {
      setName('');
      setCategory('Enzyme');
      setSupplierId(suppliers[0]?.id || '');
      setCurrentStock(100);
      setUnit('kg');
      setUnitPrice(250);
      setMinAlertLevel(50);
      setLocation('Chemical Store');
    }
  }, [itemToEdit, suppliers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const selectedSup = suppliers.find(s => s.id === supplierId);

    if (itemToEdit) {
      // Update existing item stock and fields
      updateInventoryStock(itemToEdit.id, Number(currentStock));
      // If we need to update other fields, we can update in inventory state if ERPContext supports or update properties
      // ERPContext handles updateInventoryStock
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
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-[#17383B] focus:border-[#0B9FA5] focus:outline-none"
              >
                <option value="Acid">Acid</option>
                <option value="Enzyme">Enzyme</option>
                <option value="Dye">Dye</option>
                <option value="Softener">Softener</option>
                <option value="Bleach">Bleach</option>
                <option value="Alkali">Alkali</option>
                <option value="Fixing Agent">Fixing Agent</option>
                <option value="Detergent">Detergent</option>
                <option value="Other">Other Material</option>
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
