import React, { useState } from 'react';
import { 
  Store, 
  X, 
  User, 
  Phone, 
  Mail, 
  Building2, 
  MapPin, 
  Landmark, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Plus,
  ShieldCheck
} from 'lucide-react';
import { Agency } from '../types';
import { registerNewAgency, resolveZoneForAreaAndCity, MOCK_COMPANIES } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface RegisterAgencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newAgency: Agency) => void;
}

export const RegisterAgencyModal: React.FC<RegisterAgencyModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser } = useAuth();

  // Active Tab / Step (1: Firm, 2: Contact, 3: Territory, 4: Financials)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [agencyName, setAgencyName] = useState('');
  const [agencyCode, setAgencyCode] = useState('');
  const [companyId, setCompanyId] = useState(MOCK_COMPANIES[0]?.id || 'c01');
  const [accountGroup, setAccountGroup] = useState('Sundry Debtors-Electronics');
  const [gstin, setGstin] = useState('');
  
  // Contact Person
  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');

  // Location & Territory
  const [city, setCity] = useState('Surat');
  const [areaName, setAreaName] = useState('Katargam');
  const [assignedSalesperson, setAssignedSalesperson] = useState(currentUser?.full_name || 'Chirag Patel');

  // Bank & Financials
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [branchName, setBranchName] = useState('Ring Road Branch, Surat');
  const [creditLimit, setCreditLimit] = useState<number>(250000);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-resolve live zone for preview
  const resolvedZone = resolveZoneForAreaAndCity(areaName, city);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyName.trim() || !city.trim()) {
      setActiveStep(1);
      return;
    }

    setIsSubmitting(true);

    const newAgency = registerNewAgency({
      agency_name: agencyName.trim(),
      agency_code: agencyCode.trim(),
      company_id: companyId,
      city: city.trim(),
      area_name: areaName.trim() || city.trim(),
      account_group: accountGroup,
      gstin: gstin.trim(),
      contact_person: contactPerson.trim() || 'Owner / Manager',
      mobile: mobile.trim(),
      email: email.trim(),
      credit_limit: Number(creditLimit),
      bank_name: bankName.trim(),
      account_number: accountNumber.trim(),
      ifsc_code: ifscCode.trim(),
      branch_name: branchName.trim(),
      assigned_salesperson: assignedSalesperson.trim()
    });

    setIsSubmitting(false);
    setSuccessNotice(`New Sales Agency "${agencyName}" registered & mapped to ${resolvedZone.zone_name} (${resolvedZone.region})!`);

    if (onSuccess) {
      onSuccess(newAgency);
    }

    setTimeout(() => {
      onClose();
      // Reset form
      setAgencyName('');
      setAgencyCode('');
      setGstin('');
      setContactPerson('');
      setMobile('');
      setEmail('');
      setAccountNumber('');
      setIfscCode('');
      setActiveStep(1);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-white flex items-center justify-between border-b border-sky-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-inner">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-wide">Register New B2B Sales Agency</h2>
              <p className="text-xs text-sky-300">
                Onboard agency, contact person, bank details & auto-map territory zone
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4-Step Segmented Wizard Navigation Bar */}
        <div className="grid grid-cols-4 bg-slate-100 dark:bg-slate-950 p-2 border-b border-slate-200 dark:border-slate-800 text-center gap-1">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`py-2 px-1 rounded-xl text-[11px] font-extrabold flex items-center justify-center space-x-1 transition-all ${
              activeStep === 1 
                ? 'bg-sky-500 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">1. Firm Info</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`py-2 px-1 rounded-xl text-[11px] font-extrabold flex items-center justify-center space-x-1 transition-all ${
              activeStep === 2 
                ? 'bg-sky-500 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">2. Contact Person</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(3)}
            className={`py-2 px-1 rounded-xl text-[11px] font-extrabold flex items-center justify-center space-x-1 transition-all ${
              activeStep === 3 
                ? 'bg-sky-500 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">3. Territory Zone</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(4)}
            className={`py-2 px-1 rounded-xl text-[11px] font-extrabold flex items-center justify-center space-x-1 transition-all ${
              activeStep === 4 
                ? 'bg-sky-500 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">4. Bank & Credit</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          
          {successNotice && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-200 rounded-2xl text-xs font-bold flex items-center space-x-3 animate-in zoom-in-95">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* STEP 1: Firm & Account Details */}
          {activeStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center space-x-2 text-xs font-bold text-sky-400">
                <Building2 className="w-4 h-4 text-sky-400" />
                <span>Step 1 of 4: Registered Business & Account Identification</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Agency / Business Firm Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Radhe Electronics & Agencies"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/40"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Agency Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={agencyCode}
                    onChange={(e) => setAgencyCode(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Account Classification Group
                  </label>
                  <select
                    value={accountGroup}
                    onChange={(e) => setAccountGroup(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                  >
                    <option value="Sundry Debtors-Electronics">Sundry Debtors-Electronics</option>
                    <option value="Sundry Debtors-FMCG">Sundry Debtors-FMCG</option>
                    <option value="Sundry Debtors-Retail">Sundry Debtors-Retail</option>
                    <option value="Sundry Debtors-General">Sundry Debtors-General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    15-Digit GSTIN Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 24BBXPP2871D1ZB"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mapped Brand Scope
                  </label>
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                  >
                    {MOCK_COMPANIES.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.company_name} ({c.company_code}) [{c.segment || 'FMCG'}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Contact Person Information */}
          {activeStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center space-x-2 text-xs font-bold text-sky-400">
                <User className="w-4 h-4 text-sky-400" />
                <span>Step 2 of 4: Primary Contact Person & Dealer Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Patel"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98250 12345"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="agency@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Location, Territory & Auto-Zone Mapping */}
          {activeStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center space-x-2 text-xs font-bold text-sky-400">
                <MapPin className="w-4 h-4 text-sky-400" />
                <span>Step 3 of 4: City, Locality & Auto-Resolved Territory Zone</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Surat, Navsari, Vapi"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Locality / Area Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Katargam, Varachha, Udhana"
                    value={areaName}
                    onChange={(e) => setAreaName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Field Salesperson
                  </label>
                  <input
                    type="text"
                    value={assignedSalesperson}
                    onChange={(e) => setAssignedSalesperson(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Auto-Resolved Zone Live Indicator Card */}
              <div className="p-4 bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 border border-sky-500/40 rounded-2xl flex items-center justify-between shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-sky-300 block">
                      Auto-Mapped Territory Zone:
                    </span>
                    <span className="text-[11px] text-slate-300">
                      Locality: <strong>"{areaName || city}"</strong> | City: <strong>"{city}"</strong>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-md ${
                    resolvedZone.region === 'Surat City Zone' 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {resolvedZone.zone_name} ({resolvedZone.region})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Bank Details & Approved Credit Limit */}
          {activeStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center space-x-2 text-xs font-bold text-sky-400">
                <Landmark className="w-4 h-4 text-sky-400" />
                <span>Step 4 of 4: Bank Account & Approved Credit Limit Terms</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    placeholder="50100012345678"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    placeholder="HDFC0000123"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    placeholder="Ring Road Branch, Surat"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Approved Credit Limit (₹)
                  </label>
                  <input
                    type="number"
                    step="25000"
                    min="0"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons & Wizard Controls */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              {activeStep > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveStep((prev) => (prev - 1) as any)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center space-x-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous Step</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>

              {activeStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep((prev) => (prev + 1) as any)}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center space-x-1.5"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Registering Agency...' : 'Register & Map B2B Agency'}</span>
                </button>
              )}
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
