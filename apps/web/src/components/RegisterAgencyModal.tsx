import React, { useState, useEffect } from 'react';
import { 
  Store, 
  X, 
  User, 
  Phone, 
  Mail, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  Sparkles,
  Plus,
  ShieldCheck,
  CreditCard,
  Layers,
  Zap,
  Globe,
  RefreshCw
} from 'lucide-react';
import { Agency } from '../types';
import { registerNewAgency, resolveZoneForAreaAndCity, MOCK_COMPANIES, generateNewAgencyCode, saveAgencyToSupabase, saveAreaToSupabase, saveZoneToSupabase, fetchAreasFromSupabaseTable, fetchZonesFromSupabaseAreasTable } from '../lib/supabase';
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

  // Form State - Firm Details
  const [agencyName, setAgencyName] = useState('');
  const [agencyCode, setAgencyCode] = useState('');
  const [companyId] = useState(MOCK_COMPANIES[0]?.id || 'c01');
  const [accountGroup, setAccountGroup] = useState('FMCG');
  const [gstin, setGstin] = useState('');
  
  // Contact Person
  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [assignedSalesperson, setAssignedSalesperson] = useState('Chirag Patel');

  // Location & Territory
  const [city, setCity] = useState('Surat');
  const [areaName, setAreaName] = useState('Katargam');

  // Approved Credit Limit (Default 0)
  const [creditLimit, setCreditLimit] = useState<number>(0);

  // Dynamic Lists for City, Area, Zone Dropdowns & Inline Master Addition
  const [citiesList, setCitiesList] = useState<string[]>([
    'Surat', 'Surat Rural', 'Navsari', 'Valsad', 'Vapi', 'Bharuch', 'Ankleshwar', 'Bardoli', 'Vyara', 'Ahmedabad', 'Vadodara', 'Rajkot', 'Jamnagar', 'Bhavnagar', 'Gandhinagar'
  ]);

  const [areasMap, setAreasMap] = useState<Record<string, string[]>>({
    'Surat': ['Katargam', 'Varachha', 'Amroli', 'Udhna', 'Adajan', 'Vesu', 'Parle Point', 'Piplod', 'Bhatar', 'Ring Road', 'Salabatpura', 'Begumpura', 'Rander', 'Palanpur Jakatnaka', 'Dindoli', 'Pandesara', 'Limbayat'],
    'Surat Rural': ['Kamrej', 'Bardoli', 'Kadodara', 'Kim', 'Kosamba', 'Mandvi', 'Valod', 'Mahuva', 'Palsana', 'Pasodara', 'Kathor', 'Niyol', 'Kholvad'],
    'Navsari': ['Navsari City', 'Gandevi', 'Chikhli', 'Jalalpore', 'Vansda', 'Bilimora'],
    'Valsad': ['Valsad City', 'Pardi', 'Umbergaon', 'Dharampur', 'Kaprada'],
    'Vapi': ['Vapi GIDC', 'Vapi Town', 'Chanod', 'Dungra', 'Salvav'],
    'Bharuch': ['Bharuch City', 'Jambusar', 'Zagadia', 'Vagra', 'Amod'],
    'Ankleshwar': ['Ankleshwar GIDC', 'Ankleshwar Town', 'Panoli', 'Kosamba'],
    'Bardoli': ['Bardoli Town', 'Mota', 'Valod', 'Buhari', 'Bajipura'],
    'Vyara': ['Vyara Town', 'Songadh', 'Valod', 'Uchchhal']
  });

  const [zonesList, setZonesList] = useState([
    { code: 'ZN-SUR-A', name: 'City-A (Surat City Zone)', region: 'Surat City Zone' },
    { code: 'ZN-SUR-B', name: 'City-B (Surat City Zone)', region: 'Surat City Zone' },
    { code: 'ZN-SUR-R1', name: 'Rural-1 (Surat Rural Zone)', region: 'Surat Rural Zone' },
    { code: 'ZN-SUR-R2', name: 'Rural-2 (Surat Rural Zone)', region: 'Surat Rural Zone' },
    { code: 'ZN-SUR-R3', name: 'Rural-3 (Surat Rural Zone)', region: 'Surat Rural Zone' },
    { code: 'ZN-SG-01', name: 'South Gujarat Zone', region: 'South Gujarat Region' },
    { code: 'ZN-CG-01', name: 'Central Gujarat Zone', region: 'Central Gujarat Region' },
    { code: 'ZN-NG-01', name: 'North Gujarat Zone', region: 'North Gujarat Region' },
    { code: 'ZN-SR-01', name: 'Saurashtra Zone', region: 'Saurashtra Region' }
  ]);

  const [selectedZone, setSelectedZone] = useState<string>('City-A (Surat City Zone)');

  // Inline Controls toggles
  const [showAddCity, setShowAddCity] = useState(false);
  const [newCityInput, setNewCityInput] = useState('');

  const [showAddArea, setShowAddArea] = useState(false);
  const [newAreaInput, setNewAreaInput] = useState('');

  const [showAddZone, setShowAddZone] = useState(false);
  const [newZoneCodeInput, setNewZoneCodeInput] = useState('');
  const [newZoneNameInput, setNewZoneNameInput] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

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
    const aName = newAreaInput.trim();
    setAreasMap(prev => ({
      ...prev,
      [city]: Array.from(new Set([...(prev[city] || []), aName]))
    }));
    setAreaName(aName);
    
    // Save new Area master directly to Supabase!
    await saveAreaToSupabase({
      id: `ar_${Date.now()}`,
      area_code: `AR-${(city || 'SUR').substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      area_name: aName,
      city: city,
      zone_code: 'ZN-SUR-A',
      region: resolvedZone.region || 'Surat City Zone',
      description: `New Area added via Agency Master Registration: ${aName}`
    });

    setNewAreaInput('');
    setShowAddArea(false);
  };

  const handleAddZoneInline = async () => {
    if (!newZoneNameInput.trim()) return;
    const zCode = newZoneCodeInput.trim() || `ZN-${(city || 'SUR').substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
    const zName = newZoneNameInput.trim();
    const newZoneObj = { code: zCode, name: zName, region: 'Surat City Zone' };
    
    setZonesList(prev => [...prev, newZoneObj]);
    setSelectedZone(zName);

    // Save new Zone master directly to Supabase!
    await saveZoneToSupabase({
      id: `zn_${Date.now()}`,
      zone_code: zCode,
      zone_name: zName as any,
      region: 'Surat City Zone',
      major_areas: [areaName || city],
      description: `New Zone Master created inline: ${zName}`
    });

    setNewZoneCodeInput('');
    setNewZoneNameInput('');
    setShowAddZone(false);
  };

  useEffect(() => {
    if (isOpen && !agencyCode) {
      setAgencyCode(generateNewAgencyCode(city));
    }
  }, [isOpen, city]);

  // Fetch live Areas and Zones directly from Supabase `public.areas` & `public.zones` tables
  useEffect(() => {
    if (!isOpen) return;

    fetchAreasFromSupabaseTable().then(sbAreas => {
      if (sbAreas && sbAreas.length > 0) {
        const dynamicCitiesSet = new Set<string>([
          'Surat', 'Surat Rural', 'Navsari', 'Valsad', 'Vapi', 'Bharuch', 'Ankleshwar', 'Bardoli', 'Vyara'
        ]);
        const dynamicAreasMap: Record<string, string[]> = { ...areasMap };

        sbAreas.forEach(item => {
          const cName = (item.city || 'Surat').trim();
          const aName = (item.area_name || '').trim();

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

    fetchZonesFromSupabaseAreasTable().then(sbZones => {
      if (sbZones && sbZones.length > 0) {
        const formattedZones = sbZones.map(z => ({
          code: z.zone_code,
          name: z.zone_name.includes('(') ? z.zone_name : `${z.zone_name} (${z.region})`,
          region: z.region
        }));
        setZonesList(prev => {
          const names = new Set(prev.map(p => p.name));
          const additions = formattedZones.filter(fz => !names.has(fz.name));
          return [...prev, ...additions];
        });
      }
    });
  }, [isOpen]);

  if (!isOpen) return null;

  // Auto-resolve live zone for preview
  const resolvedZone = resolveZoneForAreaAndCity(areaName, city);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyName.trim()) {
      setErrorNotice('Agency / Business Firm Name is required!');
      return;
    }
    if (!city.trim()) {
      setErrorNotice('City name is required for auto-zone mapping!');
      return;
    }

    setErrorNotice(null);
    setIsSubmitting(true);

    const newAgency = registerNewAgency({
      agency_name: agencyName.trim(),
      agency_code: agencyCode.trim(),
      company_id: companyId,
      city: city.trim(),
      area_name: areaName.trim() || city.trim(),
      account_group: accountGroup,
      gstin: gstin.trim().toUpperCase(),
      contact_person: contactPerson.trim() || '',
      mobile: mobile.trim(),
      email: email.trim(),
      credit_limit: Number(creditLimit),
      assigned_salesperson: assignedSalesperson.trim() || 'Chirag Patel',
      bank_name: '',
      account_number: '',
      ifsc_code: '',
      branch_name: ''
    });

    // Save directly to Supabase live database
    const saveRes = await saveAgencyToSupabase(newAgency);
    if (!saveRes.success && saveRes.error) {
      setIsSubmitting(false);
      setErrorNotice(`⚠️ Supabase Database Error: ${saveRes.error}`);
      return;
    }

    setIsSubmitting(false);
    setSuccessNotice(`New Agency "${agencyName}" onboarded & mapped to ${resolvedZone.zone_name} (${resolvedZone.region})!`);

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
      setSuccessNotice(null);
      setErrorNotice(null);
    }, 1200);
  };

  const creditPresets = [0, 100000, 250000, 500000, 1000000];

  return (
    <div 
      className="modal-overlay" 
      style={{ 
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(7, 14, 32, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div 
        className="modal-card" 
        style={{ 
          maxWidth: 820, 
          width: '95vw', 
          maxHeight: '90vh',
          background: '#0f172a', 
          border: '1px solid #38bdf8', 
          borderRadius: 20, 
          padding: 0, 
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 30px rgba(56, 189, 248, 0.15)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #070e20 0%, #0f172a 50%, #1e1b4b 100%)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              boxShadow: 'inset 0 0 12px rgba(56, 189, 248, 0.2)'
            }}>
              <Store size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                  Register B2B Sales Agency
                </h2>
                <span style={{ 
                  fontSize: '0.675rem', 
                  fontWeight: 800, 
                  color: '#38bdf8', 
                  background: 'rgba(56, 189, 248, 0.15)', 
                  padding: '0.2rem 0.6rem', 
                  borderRadius: 6, 
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  New Partner Form
                </span>
              </div>
              <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginTop: 2 }}>
                Onboard agency firm, dealer contact details, territory location & approved credit terms
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              borderRadius: 10,
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#334155';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1e293b';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Single Form Body Content */}
        <form onSubmit={handleSubmit} style={{ 
          padding: '1.25rem 1.5rem', 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          
          {errorNotice && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              color: '#fda4af',
              borderRadius: 12,
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}>
              <X size={16} color="#f43f5e" />
              <span>{errorNotice}</span>
            </div>
          )}

          {successNotice && (
            <div style={{
              padding: '0.85rem 1.15rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#6ee7b7',
              borderRadius: 12,
              fontSize: '0.825rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <CheckCircle2 size={20} color="#34d399" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* SECTION 1: Firm & Account Details */}
          <div style={{
            background: '#070e20',
            border: '1px solid #1e293b',
            borderRadius: 14,
            padding: '1.15rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{
              fontSize: '0.825rem',
              fontWeight: 800,
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid #1e293b'
            }}>
              <Building2 size={16} />
              <span>1. Business Firm & Account Classification</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Agency / Business Firm Name <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  padding: '0.6rem 0.8rem',
                  gap: '0.6rem'
                }}>
                  <Store size={16} color="#64748b" />
                  <input
                    type="text"
                    placeholder="e.g. Krishna Trading Agency"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#f8fafc',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      width: '100%'
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1' }}>
                    Agency Code <span style={{ color: '#38bdf8', fontWeight: 700 }}>(Auto-Generated)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setAgencyCode(generateNewAgencyCode(city))}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <RefreshCw size={11} /> Auto-Generate
                  </button>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#0f172a',
                  border: '1px solid #38bdf8',
                  borderRadius: 10,
                  padding: '0.6rem 0.8rem',
                  gap: '0.6rem'
                }}>
                  <ShieldCheck size={16} color="#38bdf8" />
                  <input
                    type="text"
                    placeholder="Auto-generated (e.g. AG-SUR-102)"
                    value={agencyCode}
                    onChange={(e) => setAgencyCode(e.target.value.toUpperCase())}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#38bdf8',
                      fontSize: '0.825rem',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      width: '100%'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Account Group
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  padding: '0.6rem 0.8rem',
                  gap: '0.6rem'
                }}>
                  <Layers size={16} color="#64748b" />
                  <select
                    value={accountGroup}
                    onChange={(e) => setAccountGroup(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#f8fafc',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      width: '100%'
                    }}
                  >
                    <option value="FMCG" style={{ background: '#0f172a', color: '#fff' }}>FMCG (Fast Moving Consumer Goods)</option>
                    <option value="FMCD" style={{ background: '#0f172a', color: '#fff' }}>FMCD (Fast Moving Consumer Durables)</option>
                    <option value="FMCG, FMCD" style={{ background: '#0f172a', color: '#fff' }}>FMCG & FMCD (Dual Segment)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  15-Digit GSTIN Number
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  padding: '0.6rem 0.8rem',
                  gap: '0.6rem'
                }}>
                  <CreditCard size={16} color="#64748b" />
                  <input
                    type="text"
                    placeholder="e.g. 24BBXPP2871D1ZB"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#f8fafc',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      width: '100%'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Primary Dealer Contact */}
          <div style={{
            background: '#070e20',
            border: '1px solid #1e293b',
            borderRadius: 14,
            padding: '1.15rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{
              fontSize: '0.825rem',
              fontWeight: 800,
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid #1e293b'
            }}>
              <User size={16} />
              <span>2. Primary Contact & Dealer Details</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Contact Person Name
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  padding: '0.6rem 0.8rem',
                  gap: '0.6rem'
                }}>
                  <User size={16} color="#64748b" />
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Sharma"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#f8fafc',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      width: '100%'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Mobile Phone Number
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  padding: '0.6rem 0.8rem',
                  gap: '0.6rem'
                }}>
                  <Phone size={16} color="#64748b" />
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#f8fafc',
                      fontSize: '0.825rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      width: '100%'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Email Address
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  padding: '0.6rem 0.8rem',
                  gap: '0.6rem'
                }}>
                  <Mail size={16} color="#64748b" />
                  <input
                    type="email"
                    placeholder="rajesh@agency.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#f8fafc',
                      fontSize: '0.8rem',
                      width: '100%'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Assigned Salespersons (Multiple Allowed, Comma-Separated)
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 10,
                padding: '0.6rem 0.8rem',
                gap: '0.6rem'
              }}>
                <ShieldCheck size={16} color="#34d399" />
                <input
                  type="text"
                  placeholder="e.g. Chirag Patel, Nikhil, Rahul Sharma"
                  value={assignedSalesperson}
                  onChange={(e) => setAssignedSalesperson(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#34d399',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    width: '100%'
                  }}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Location, Territory & Credit Terms */}
          <div style={{
            background: '#070e20',
            border: '1px solid #1e293b',
            borderRadius: 14,
            padding: '1.15rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{
              fontSize: '0.825rem',
              fontWeight: 800,
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid #1e293b'
            }}>
              <MapPin size={16} />
              <span>3. Location, Territory Auto-Zone & Credit Terms</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              {/* City Selection Dropdown & Inline Add Button */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1' }}>
                    City Name <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCity(!showAddCity)}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      color: '#38bdf8',
                      borderRadius: 6,
                      padding: '0.15rem 0.5rem',
                      fontSize: '0.675rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <Plus size={12} /> Add City
                  </button>
                </div>

                {showAddCity ? (
                  <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Enter new City name"
                      value={newCityInput}
                      onChange={(e) => setNewCityInput(e.target.value)}
                      style={{
                        flex: 1,
                        background: '#0f172a',
                        border: '1px solid #38bdf8',
                        borderRadius: 8,
                        padding: '0.45rem 0.65rem',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCityInline}
                      style={{
                        background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Save
                    </button>
                  </div>
                ) : null}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  padding: '0.6rem 0.8rem',
                  gap: '0.6rem'
                }}>
                  <Globe size={16} color="#64748b" />
                  <select
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      const availableAreas = areasMap[e.target.value] || [];
                      if (availableAreas.length > 0) {
                        setAreaName(availableAreas[0]);
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#f8fafc',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      width: '100%',
                      cursor: 'pointer'
                    }}
                  >
                    {citiesList.map((c, idx) => (
                      <option key={idx} value={c} style={{ background: '#0f172a', color: '#fff' }}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Locality / Area Dropdown & Inline Add Button */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1' }}>
                    Locality / Area Name <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddArea(!showAddArea)}
                    style={{
                      background: 'rgba(52, 211, 153, 0.15)',
                      border: '1px solid rgba(52, 211, 153, 0.35)',
                      color: '#34d399',
                      borderRadius: 6,
                      padding: '0.15rem 0.5rem',
                      fontSize: '0.675rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <Plus size={12} /> Add Area
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
                        flex: 1,
                        background: '#0f172a',
                        border: '1px solid #34d399',
                        borderRadius: 8,
                        padding: '0.45rem 0.65rem',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddAreaInline}
                      style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Save Area
                    </button>
                  </div>
                ) : null}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  padding: '0.6rem 0.8rem',
                  gap: '0.6rem'
                }}>
                  <MapPin size={16} color="#64748b" />
                  <select
                    value={areaName}
                    onChange={(e) => setAreaName(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#f8fafc',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      width: '100%',
                      cursor: 'pointer'
                    }}
                  >
                    {(areasMap[city] || [areaName || city]).map((a, idx) => (
                      <option key={idx} value={a} style={{ background: '#0f172a', color: '#fff' }}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Mapped Zone Dropdown & Inline Add Zone Master Controls */}
            <div style={{
              padding: '0.85rem 1.15rem',
              background: 'linear-gradient(135deg, rgba(7, 14, 32, 0.9), rgba(15, 23, 42, 0.9))',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.775rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>Mapped Territory Zone Resolution</span>
                  <Zap size={13} color="#f59e0b" />
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddZone(!showAddZone)}
                  style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    color: '#fbbf24',
                    borderRadius: 6,
                    padding: '0.15rem 0.5rem',
                    fontSize: '0.675rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                >
                  <Plus size={12} /> Add Zone Master
                </button>
              </div>

              {showAddZone ? (
                <div style={{ display: 'flex', gap: '0.35rem', background: '#0b1329', padding: '0.5rem', borderRadius: 8, border: '1px solid #fbbf24' }}>
                  <input
                    type="text"
                    placeholder="Zone Code (e.g. ZN-SUR-C)"
                    value={newZoneCodeInput}
                    onChange={(e) => setNewZoneCodeInput(e.target.value)}
                    style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '0.35rem 0.55rem', color: '#fff', fontSize: '0.75rem' }}
                  />
                  <input
                    type="text"
                    placeholder="Zone Name (e.g. City-C)"
                    value={newZoneNameInput}
                    onChange={(e) => setNewZoneNameInput(e.target.value)}
                    style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '0.35rem 0.55rem', color: '#fff', fontSize: '0.75rem' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddZoneInline}
                    style={{ background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: 6, padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Save Zone
                  </button>
                </div>
              ) : null}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  style={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    padding: '0.45rem 0.75rem',
                    color: '#fbbf24',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    outline: 'none',
                    flex: 1
                  }}
                >
                  {zonesList.map((z, idx) => (
                    <option key={idx} value={z.name} style={{ background: '#0f172a', color: '#fff' }}>
                      {z.name}
                    </option>
                  ))}
                  <option value={resolvedZone.zone_name} style={{ background: '#0f172a', color: '#fff' }}>
                    Auto-Resolved: {resolvedZone.zone_name} ({resolvedZone.region})
                  </option>
                </select>
              </div>
            </div>

            {/* Auto-Resolved Zone Live Preview Card */}
            <div style={{
              padding: '0.85rem 1.15rem',
              background: 'linear-gradient(135deg, rgba(7, 14, 32, 0.9), rgba(15, 23, 42, 0.9))',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8'
                }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.775rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>Auto-Mapped Territory Zone Resolution</span>
                    <Zap size={13} color="#f59e0b" />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>
                    Locality: <strong style={{ color: '#f8fafc' }}>"{areaName || city}"</strong> | City: <strong style={{ color: '#f8fafc' }}>"{city}"</strong>
                  </div>
                </div>
              </div>

              <div>
                <span style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 8,
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  background: resolvedZone.region === 'Surat City Zone' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: resolvedZone.region === 'Surat City Zone' ? '#fbbf24' : '#34d399',
                  border: resolvedZone.region === 'Surat City Zone' ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(16, 185, 129, 0.35)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}>
                  {resolvedZone.zone_name} ({resolvedZone.region})
                </span>
              </div>
            </div>

            {/* Credit Limit Input & Presets */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr',
              gap: '1rem',
              alignItems: 'center',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 12,
              padding: '0.85rem 1rem'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Approved Credit Limit (₹)
                </label>
                <input
                  type="number"
                  step="25000"
                  min="0"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    background: '#070e20',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    color: '#fbbf24',
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                  Quick Presets:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {creditPresets.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCreditLimit(val)}
                      style={{
                        padding: '0.3rem 0.65rem',
                        borderRadius: 8,
                        fontSize: '0.725rem',
                        fontWeight: 800,
                        background: creditLimit === val ? 'rgba(245, 158, 11, 0.2)' : '#1e293b',
                        color: creditLimit === val ? '#fbbf24' : '#cbd5e1',
                        border: creditLimit === val ? '1px solid #f59e0b' : '1px solid #334155',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {val === 0 ? '₹0 (Zero Limit)' : `₹${(val / 100000).toLocaleString()} Lakh`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div style={{
            paddingTop: '1rem',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '0.25rem'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.6rem 1.2rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#94a3b8',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 10,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.65rem 1.6rem',
                fontSize: '0.825rem',
                fontWeight: 800,
                color: '#ffffff',
                background: 'linear-gradient(135deg, #059669, #0d9488)',
                border: 'none',
                borderRadius: 10,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: isSubmitting ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              <Plus size={16} />
              <span>{isSubmitting ? 'Registering Agency...' : 'Register & Map B2B Agency'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
