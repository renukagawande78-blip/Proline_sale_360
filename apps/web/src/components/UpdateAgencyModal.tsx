import React, { useState, useEffect } from 'react';
import {
  Store,
  X,
  User,
  Building2,
  MapPin,
  Landmark,
  CheckCircle2,
  Sparkles,
  Save,
  CreditCard,
  Phone,
  Mail,
  Hash,
  BadgeIndianRupee,
  ShieldCheck
} from 'lucide-react';
import { Agency } from '../types';
import { Plus } from 'lucide-react';
import { updateAgencyDetails, resolveZoneForAreaAndCity, MOCK_COMPANIES, saveAgencyToSupabase, saveAreaToSupabase, saveZoneToSupabase, fetchAreasFromSupabaseTable } from '../lib/supabase';
import { DEFAULT_AREAS_BY_CITY, normalizeAreaName } from '../data/officialAreasData';

interface UpdateAgencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  agency: Agency | null;
  onSuccess?: (updatedAgency: Agency) => void;
}

// Reusable styled field components
const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label style={{
    display: 'block', fontSize: '0.675rem', fontWeight: 800,
    color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5
  }}>
    {children}{required && <span style={{ color: '#fb7185', marginLeft: 3 }}>*</span>}
  </label>
);

const FieldInput = ({
  type = 'text', value, onChange, placeholder = '', mono = false, required = false, readOnly = false
}: {
  type?: string; value: string | number; onChange: (v: string) => void;
  placeholder?: string; mono?: boolean; required?: boolean; readOnly?: boolean;
}) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    required={required}
    readOnly={readOnly}
    style={{
      width: '100%', padding: '0.6rem 0.85rem',
      background: readOnly ? '#0a1120' : '#141f36',
      border: '1.5px solid #1e3a5f',
      borderRadius: 10, color: readOnly ? '#475569' : '#f8fafc',
      fontSize: '0.825rem', fontWeight: 700,
      fontFamily: mono ? 'monospace' : 'inherit',
      outline: 'none', boxSizing: 'border-box',
      cursor: readOnly ? 'not-allowed' : 'text',
      transition: 'border-color 0.15s'
    }}
    onFocus={e => { if (!readOnly) e.target.style.borderColor = '#38bdf8'; }}
    onBlur={e => { e.target.style.borderColor = '#1e3a5f'; }}
  />
);

const FieldSelect = ({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode;
}) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{
      width: '100%', padding: '0.6rem 0.85rem',
      background: '#141f36', border: '1.5px solid #1e3a5f',
      borderRadius: 10, color: '#f8fafc',
      fontSize: '0.825rem', fontWeight: 700, outline: 'none',
      cursor: 'pointer', boxSizing: 'border-box',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%2364748b' height='16' viewBox='0 0 24 24' width='16' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 0.65rem center'
    }}
  >
    {children}
  </select>
);

const SectionHeader = ({ icon: Icon, label, color }: { icon: any; label: string; color: string }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    paddingBottom: '0.6rem', marginBottom: '0.85rem',
    borderBottom: `1.5px solid rgba(30,58,95,0.8)`
  }}>
    <div style={{
      width: 28, height: 28, borderRadius: 8,
      background: `rgba(${color},0.15)`, border: `1px solid rgba(${color},0.3)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <Icon size={14} color={`rgb(${color})`} />
    </div>
    <span style={{ fontSize: '0.725rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
      {label}
    </span>
  </div>
);

export const UpdateAgencyModal: React.FC<UpdateAgencyModalProps> = ({
  isOpen, onClose, agency, onSuccess
}) => {
  const [agencyName, setAgencyName] = useState('');
  const [agencyCode, setAgencyCode] = useState('');
  const [companyId, setCompanyId] = useState(MOCK_COMPANIES[0]?.id || 'c01');
  const [accountGroup, setAccountGroup] = useState('FMCG');
  const [gstin, setGstin] = useState('');

  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');

  const [city, setCity] = useState('Surat');
  const [areaName, setAreaName] = useState('Katargam');
  const [pincode, setPincode] = useState('');
  const [assignedSalesperson, setAssignedSalesperson] = useState('');

  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [branchName, setBranchName] = useState('');
  const [creditLimit, setCreditLimit] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Dynamic Lists for City, Area, Zone Dropdowns & Inline Master Addition
  const [citiesList, setCitiesList] = useState<string[]>([
    'Surat', 'Surat Rural', 'Navsari', 'Valsad', 'Vapi', 'Bharuch', 'Ankleshwar', 'Bardoli', 'Vyara', 'Ahmedabad', 'Vadodara', 'Rajkot', 'Jamnagar', 'Bhavnagar', 'Gandhinagar'
  ]);

  const [areasMap, setAreasMap] = useState<Record<string, string[]>>(DEFAULT_AREAS_BY_CITY);

  const [showAddCity, setShowAddCity] = useState(false);
  const [newCityInput, setNewCityInput] = useState('');

  const [showAddArea, setShowAddArea] = useState(false);
  const [newAreaInput, setNewAreaInput] = useState('');

  const handleAddCityInline = () => {
    if (!newCityInput.trim()) return;
    const cName = newCityInput.trim();
    if (!citiesList.includes(cName)) {
      setCitiesList(prev => [...prev, cName]);
    }
    setCity(cName);
    setNewCityInput('');
    setShowAddCity(false);
  };

  const handleAddAreaInline = async () => {
    if (!newAreaInput.trim()) return;
    const rawName = newAreaInput.trim();
    const aName = normalizeAreaName(rawName) || rawName;
    setAreasMap(prev => ({
      ...prev,
      [city]: Array.from(new Set([...(prev[city] || []), aName]))
    }));
    setAreaName(aName);

    await saveAreaToSupabase({
      id: `ar_${Date.now()}`,
      area_code: `AR-${(city || 'SUR').substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      area_name: aName,
      city: city,
      zone_code: 'ZN-SUR-A',
      region: resolvedZone.region || 'City',
      description: `New Area added via Agency Master Update: ${aName}`
    });

    setNewAreaInput('');
    setShowAddArea(false);
  };

  useEffect(() => {
    if (agency) {
      setAgencyName(agency.agency_name || '');
      setAgencyCode(agency.agency_code || '');
      setCompanyId(agency.company_id || MOCK_COMPANIES[0]?.id || 'c01');
      setAccountGroup(agency.account_group || 'FMCG');
      setGstin(agency.gstin || agency.gst_number || '');
      setContactPerson(agency.contact_person || '');
      setMobile(agency.mobile || '');
      setEmail(agency.email || '');
      setCity(agency.city || 'Surat');
      setAreaName(agency.area_name || 'Katargam');
      setPincode(agency.pincode || agency.pin_code || '');
      setAssignedSalesperson(agency.assigned_salesperson || '');
      setBankName(agency.bank_name || 'HDFC Bank');
      setAccountNumber(agency.account_number || '');
      setIfscCode(agency.ifsc_code || '');
      setBranchName(agency.branch_name || '');
      setCreditLimit(agency.credit_limit !== undefined ? Number(agency.credit_limit) : 0);
      setSuccessNotice(null);

      // Fetch live Areas from Supabase `public.areas`
      fetchAreasFromSupabaseTable().then(sbAreas => {
        if (sbAreas && sbAreas.length > 0) {
          const dynamicCitiesSet = new Set<string>([
            'Surat', 'Surat Rural', 'Navsari', 'Valsad', 'Vapi', 'Bharuch', 'Ankleshwar', 'Bardoli', 'Vyara'
          ]);
          const dynamicAreasMap: Record<string, string[]> = { ...DEFAULT_AREAS_BY_CITY };

          sbAreas.forEach(item => {
            const cName = (item.city || 'Surat').trim();
            const aName = normalizeAreaName(item.area_name) || (item.area_name || '').trim();

            dynamicCitiesSet.add(cName);

            if (!dynamicAreasMap[cName]) {
              dynamicAreasMap[cName] = [];
            }
            if (aName && !dynamicAreasMap[cName].includes(aName)) {
              dynamicAreasMap[cName].push(aName);
            }
          });

          setCitiesList(Array.from(dynamicCitiesSet));
          setAreasMap(dynamicAreasMap);
        }
      });
    }
  }, [isOpen, agency]);

  if (!isOpen || !agency) return null;

  const resolvedZone = resolveZoneForAreaAndCity(areaName, city);
  const isSuratZone = resolvedZone.region === 'Surat City Zone';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyName.trim() || !city.trim()) return;
    setIsSubmitting(true);
    setErrorNotice(null);

    const updated = updateAgencyDetails(agency.id, {
      agency_name: agencyName.trim(),
      agency_code: agencyCode.trim(),
      company_id: companyId,
      account_group: accountGroup,
      gstin: gstin.trim(),
      contact_person: contactPerson.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      city: city.trim(),
      area_name: areaName.trim() || city.trim(),
      pincode: pincode.trim(),
      pin_code: pincode.trim(),
      assigned_salesperson: assignedSalesperson.trim(),
      bank_name: bankName.trim(),
      account_number: accountNumber.trim(),
      ifsc_code: ifscCode.trim(),
      branch_name: branchName.trim(),
      credit_limit: Number(creditLimit)
    });

    const res = await saveAgencyToSupabase(updated);
    if (!res.success && res.error) {
      setIsSubmitting(false);
      setErrorNotice(`⚠️ Supabase Server Error: ${res.error}`);
      return;
    }

    setIsSubmitting(false);
    setSuccessNotice(`Party details for "${agencyName}" updated successfully in Supabase!`);
    if (onSuccess) onSuccess(updated);
    setTimeout(() => onClose(), 1400);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem'
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #0d1b2e 100%)',
        border: '1.5px solid #1e3a5f',
        borderRadius: 20,
        width: '100%', maxWidth: 720,
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(56,189,248,0.08)',
        overflow: 'hidden'
      }}>

        {/* ── MODAL HEADER ────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #1e3a5f',
          background: 'linear-gradient(135deg, #0d1b2e, #0a1628)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'rgba(56,189,248,0.15)', border: '1.5px solid rgba(56,189,248,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 12px rgba(56,189,248,0.2)'
            }}>
              <Store size={20} color="#38bdf8" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                Edit Party & Sales Agency
              </h2>
              <p style={{ fontSize: '0.725rem', color: '#38bdf8', margin: 0, fontWeight: 600 }}>
                {agency.agency_code} · {agency.agency_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: 10, background: 'rgba(100,116,139,0.15)',
              border: '1px solid #334155', color: '#94a3b8', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.2)'; e.currentTarget.style.color = '#fb7185'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(100,116,139,0.15)'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── MODAL BODY FORM ────────────────────── */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>

          {errorNotice && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)',
              borderRadius: 12, padding: '0.85rem 1rem', color: '#fb7185',
              fontSize: '0.825rem', fontWeight: 800
            }}>
              {errorNotice}
            </div>
          )}

          {/* Success Notice */}
          {successNotice && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.85rem 1rem',
              background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.35)',
              borderRadius: 12, fontSize: '0.8rem', color: '#34d399', fontWeight: 700
            }}>
              <CheckCircle2 size={18} color="#34d399" />
              {successNotice}
            </div>
          )}

          {/* ── SECTION 1: Firm & Account Identification ── */}
          <section style={{ background: '#0a1525', border: '1px solid #1e293b', borderRadius: 14, padding: '1.15rem' }}>
            <SectionHeader icon={Building2} label="1 · Firm & Account Identification" color="56,189,248" />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
              <div>
                <FieldLabel required>Agency / Firm Name</FieldLabel>
                <FieldInput value={agencyName} onChange={setAgencyName} placeholder="Full firm name" required />
              </div>
              <div>
                <FieldLabel>Agency Code</FieldLabel>
                <FieldInput value={agencyCode} onChange={setAgencyCode} placeholder="AG-XXX-001" mono />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div>
                <FieldLabel>Account Group / Agency Type</FieldLabel>
                <FieldSelect value={accountGroup} onChange={setAccountGroup}>
                  <option value="FMCG">FMCG</option>
                  <option value="FMCD">FMCD</option>
                  <option value="FMCG, FMCD">FMCG & FMCD (Dual Segment)</option>
                </FieldSelect>
              </div>
              <div>
                <FieldLabel>15-Digit GSTIN</FieldLabel>
                <FieldInput value={gstin} onChange={setGstin} placeholder="24AABCC1234D1Z5" mono />
              </div>
            </div>
          </section>

          {/* ── SECTION 2: Contact Person ── */}
          <section style={{ background: '#0a1525', border: '1px solid #1e293b', borderRadius: 14, padding: '1.15rem' }}>
            <SectionHeader icon={User} label="2 · Contact Person Information" color="167,139,250" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
              <div>
                <FieldLabel>Contact Person Name</FieldLabel>
                <FieldInput value={contactPerson} onChange={setContactPerson} placeholder="Full name" />
              </div>
              <div>
                <FieldLabel>Mobile Number</FieldLabel>
                <FieldInput value={mobile} onChange={setMobile} placeholder="+91 98250 00000" mono />
              </div>
              <div>
                <FieldLabel>Email Address</FieldLabel>
                <FieldInput type="email" value={email} onChange={setEmail} placeholder="firm@email.com" />
              </div>
            </div>
          </section>

          {/* ── SECTION 3: Territory & Zone ── */}
          <section style={{ background: '#0a1525', border: '1px solid #1e293b', borderRadius: 14, padding: '1.15rem' }}>
            <SectionHeader icon={MapPin} label="3 · Territory, City & Auto-Zone Assignment" color="52,211,153" />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.9fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <FieldLabel required>City</FieldLabel>
                  <button
                    type="button"
                    onClick={() => setShowAddCity(!showAddCity)}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      color: '#38bdf8',
                      borderRadius: 6,
                      padding: '0.1rem 0.45rem',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <Plus size={10} /> Add City
                  </button>
                </div>

                {showAddCity ? (
                  <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="New City"
                      value={newCityInput}
                      onChange={(e) => setNewCityInput(e.target.value)}
                      style={{
                        flex: 1, background: '#141f36', border: '1px solid #38bdf8',
                        borderRadius: 6, padding: '0.35rem 0.5rem', color: '#fff', fontSize: '0.75rem'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCityInline}
                      style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: 6, padding: '0.35rem 0.6rem', fontSize: '0.725rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Save
                    </button>
                  </div>
                ) : null}

                <FieldSelect value={city} onChange={(v) => {
                  setCity(v);
                  const avail = areasMap[v] || [];
                  if (avail.length > 0) setAreaName(avail[0]);
                }}>
                  {citiesList.map((c, idx) => (
                    <option key={idx} value={c}>{c}</option>
                  ))}
                </FieldSelect>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <FieldLabel>Area / Locality</FieldLabel>
                  <button
                    type="button"
                    onClick={() => setShowAddArea(!showAddArea)}
                    style={{
                      background: 'rgba(52, 211, 153, 0.15)',
                      border: '1px solid rgba(52, 211, 153, 0.35)',
                      color: '#34d399',
                      borderRadius: 6,
                      padding: '0.1rem 0.45rem',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <Plus size={10} /> Add Area
                  </button>
                </div>

                {showAddArea ? (
                  <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder={`New Area for ${city}`}
                      value={newAreaInput}
                      onChange={(e) => setNewAreaInput(e.target.value)}
                      style={{
                        flex: 1, background: '#141f36', border: '1px solid #34d399',
                        borderRadius: 6, padding: '0.35rem 0.5rem', color: '#fff', fontSize: '0.75rem'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddAreaInline}
                      style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '0.35rem 0.6rem', fontSize: '0.725rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Save Area
                    </button>
                  </div>
                ) : null}

                <FieldSelect value={areaName} onChange={setAreaName}>
                  {(areasMap[city] || [areaName || city]).map((a, idx) => (
                    <option key={idx} value={a}>{a}</option>
                  ))}
                </FieldSelect>
              </div>

              <div>
                <FieldLabel>PIN Code</FieldLabel>
                <FieldInput
                  value={pincode}
                  onChange={(v) => setPincode(v.replace(/\D/g, ''))}
                  placeholder="e.g. 395004"
                  mono
                />
              </div>
            </div>

            {/* Auto Zone Resolve Banner */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.7rem 1rem',
              background: isSuratZone ? 'rgba(251,191,36,0.08)' : 'rgba(52,211,153,0.08)',
              border: `1px solid ${isSuratZone ? 'rgba(251,191,36,0.3)' : 'rgba(52,211,153,0.3)'}`,
              borderRadius: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Sparkles size={15} color={isSuratZone ? '#fbbf24' : '#34d399'} />
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: isSuratZone ? '#fbbf24' : '#34d399' }}>
                    Auto-Resolved Zone Assignment
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                    Based on Area <strong style={{ color: '#94a3b8' }}>"{areaName || city}"</strong> & City <strong style={{ color: '#94a3b8' }}>"{city}"</strong>
                  </div>
                </div>
              </div>
              <span style={{
                padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.725rem', fontWeight: 900,
                background: isSuratZone ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)',
                color: isSuratZone ? '#fbbf24' : '#34d399',
                border: `1px solid ${isSuratZone ? 'rgba(251,191,36,0.4)' : 'rgba(52,211,153,0.4)'}`,
              }}>
                {resolvedZone.zone_name} · {resolvedZone.region}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginTop: '0.85rem' }}>
              <div>
                <FieldLabel>Approved Credit Limit (₹)</FieldLabel>
                <FieldInput type="number" value={creditLimit} onChange={v => setCreditLimit(Number(v))} />
              </div>
              <div style={{
                padding: '0.5rem 0.85rem',
                background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)',
                borderRadius: 10, display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '1.4rem'
              }}>
                <ShieldCheck size={15} color="#38bdf8" />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Limit:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#38bdf8' }}>
                  ₹{Number(creditLimit).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </section>
        </form>

        {/* ── FOOTER ACTIONS ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1rem 1.5rem',
          borderTop: '1px solid #1e3a5f',
          background: '#0a1120',
          flexShrink: 0
        }}>
          <div style={{ fontSize: '0.72rem', color: '#334155', fontWeight: 700 }}>
            All changes auto-save to master & reflect in orders immediately.
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.6rem 1.25rem', borderRadius: 10,
                background: 'rgba(100,116,139,0.12)', border: '1px solid #334155',
                color: '#94a3b8', fontWeight: 700, fontSize: '0.825rem', cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(100,116,139,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(100,116,139,0.12)'; }}
            >
              Cancel
            </button>
            <button
              type="submit"
              form=""
              onClick={handleSubmit as any}
              disabled={isSubmitting}
              style={{
                padding: '0.6rem 1.4rem', borderRadius: 10,
                background: isSubmitting
                  ? 'rgba(56,189,248,0.3)'
                  : 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                border: 'none', color: 'white',
                fontWeight: 800, fontSize: '0.825rem', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                boxShadow: isSubmitting ? 'none' : '0 4px 15px rgba(14,165,233,0.35)',
                transition: 'all 0.15s'
              }}
            >
              <Save size={15} />
              {isSubmitting ? 'Saving...' : 'Save Party Changes'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
