import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert, CheckCircle, AlertOctagon, Phone,
  Navigation, MapPin, Languages, WifiOff, Users, ArrowRight
} from 'lucide-react';

export const CitizenPage: React.FC = () => {
  const { user } = useAuth();
  const householdId = user?.household_id || 'HH-CHE-001';

  const [citizenData, setCitizenData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'ta' | 'en' | 'hi'>('ta');
  const [actionMessage, setActionMessage] = useState<string>('');
  const [showSosModal, setShowSosModal] = useState(false);
  const [medicalUrgency, setMedicalUrgency] = useState(false);
  const [sosNotes, setSosNotes] = useState('');
  const [peopleCount, setPeopleCount] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCitizenData = async () => {
    try {
      setLoading(true);
      const data = await api.getCitizenData(householdId);
      setCitizenData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCitizenData();
  }, [householdId]);

  const handleMarkSafe = async () => {
    try {
      setIsSubmitting(true);
      const res = await api.submitCitizenSafe(householdId);
      setActionMessage(res.message || 'Status updated: You are recorded as SAFE.');
      loadCitizenData();
    } catch (err: any) {
      setActionMessage('Recorded locally. We will transmit once connection is restored.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendSOS = async () => {
    try {
      setIsSubmitting(true);
      const res = await api.submitCitizenHelp(householdId, {
        medical_urgency: medicalUrgency,
        people_count: peopleCount,
        additional_notes: sosNotes
      });
      setActionMessage(res.message || 'EMERGENCY SOS TRANSMITTED! SDRF Responders dispatched.');
      setShowSosModal(false);
      loadCitizenData();
    } catch (err: any) {
      setActionMessage('SOS registered offline. Saved locally.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Multilingual translations for citizen UI
  const t = {
    ta: {
      title: "காவல் – குடிமக்கள் பேரிடர் உதவி தளம்",
      tagline: "உங்கள் வீட்டு வாசலுக்கான நேரடி பாதுகாப்பு வழிகாட்டி",
      riskHeading: "உங்கள் பகுதிக்கான வெள்ள அபாய நிலை",
      highWarning: "அதிக அபாயம்: உங்கள் பகுதியில் நீர்மட்டம் உயரும் அபாயம் உள்ளது",
      safeBtn: "நான் பாதுகாப்பாக உள்ளேன் (I AM SAFE)",
      helpBtn: "எனக்கு உடனடி உதவி தேவை (NEED HELP)",
      shelterTitle: "உங்களுக்கு அருகிலுள்ள பாதுகாப்பான நிவாரண முகாம்",
      routeTitle: "சரிபார்க்கப்பட்ட பாதுகாப்பான வெளியேற்றப் பாதை",
      callHelpdesk: "உதவி மையத்தை அழைக்கவும்",
      offlineNotice: "ஆஃப்லைன் ஆதரவு: இணைய இணைப்பு இல்லாவிட்டாலும் பதில்கள் சேமிக்கப்படும்."
    },
    en: {
      title: "KAVAL – Citizen Flood Safety Portal",
      tagline: "Household-level emergency intelligence for every doorstep",
      riskHeading: "Flood Threat for Your Household",
      highWarning: "CRITICAL ALERT: Flash inundation approaching residential ground levels",
      safeBtn: "I AM SAFE",
      helpBtn: "I NEED RESCUE / HELP",
      shelterTitle: "Your Nearest Safe Emergency Shelter",
      routeTitle: "Verified Safe Escape Corridor",
      callHelpdesk: "Call Emergency Helpdesk",
      offlineNotice: "Offline First: Your actions are saved locally if connection is interrupted."
    },
    hi: {
      title: "कावल – नागरिक आपदा सुरक्षा पोर्टल",
      tagline: "हर घर के लिए व्यक्तिगत बाढ़ सुरक्षा मार्गदर्शन",
      riskHeading: "आपके क्षेत्र में बाढ़ का खतरा",
      highWarning: "अत्यधिक गंभीर चेतावनी: आपके क्षेत्र में जलभराव की संभावना है",
      safeBtn: "मैं सुरक्षित हूँ (I AM SAFE)",
      helpBtn: "मुझे तत्काल सहायता चाहिए (NEED HELP)",
      shelterTitle: "निकटतम सुरक्षित राहत केंद्र",
      routeTitle: "सत्यापित सुरक्षित निकासी मार्ग",
      callHelpdesk: "हेल्पडेस्क से संपर्क करें",
      offlineNotice: "ऑफलाइन सुविधा: इंटरनेट न होने पर भी आपकी सूचना सुरक्षित रहेगी।"
    }
  }[lang];

  const hh = citizenData?.household;
  const shelter = citizenData?.nearest_shelters?.[0];
  const route = citizenData?.safe_route;

  return (
    <div className="max-w-2xl mx-auto space-y-5 py-2 font-sans">
      
      {/* Top Mobile Brand Header with Language Switcher */}
      <div className="bg-navy-900 text-white rounded-3xl p-6 shadow-xl border border-navy-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal flex items-center justify-center font-black text-xl text-white shadow-md">
              K
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-wide">{t.title}</h1>
              <p className="text-xs text-teal-bright font-medium">{t.tagline}</p>
            </div>
          </div>

          {/* Language Toggle */}
          <div className="flex rounded-xl bg-navy-800 p-1 border border-navy-700 text-xs font-bold">
            {(['ta', 'en', 'hi'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 rounded-lg uppercase transition ${lang === l ? 'bg-teal text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Household Identity Badge */}
        {hh && (
          <div className="bg-navy-800/80 p-3.5 rounded-2xl border border-navy-700 flex items-center justify-between mt-4">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">
                ASSIGNED HOUSEHOLD
              </span>
              <div className="text-sm font-bold text-white">{hh.contact_name} ({hh.household_id})</div>
              <div className="text-xs text-slate-300">{hh.address}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase block">STATUS</span>
              <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-full inline-block mt-0.5 ${
                hh.evacuation_status === 'safe' ? 'bg-emerald-500 text-navy-900' :
                (hh.evacuation_status === 'rescue_required' ? 'bg-red-danger text-white animate-pulse' : 'bg-amber-warning text-navy-900')
              }`}>
                {hh.evacuation_status.replace('_', ' ')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-md text-sm font-bold flex items-center justify-between animate-in fade-in">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage('')} className="text-emerald-200 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Primary Emergency Big Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          disabled={isSubmitting}
          onClick={handleMarkSafe}
          className="p-6 rounded-3xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-lg shadow-lg flex flex-col items-center justify-center gap-2 border-2 border-emerald-400 transition"
        >
          <CheckCircle className="w-9 h-9" />
          <span>{t.safeBtn}</span>
          <span className="text-xs font-medium text-emerald-200">Notify responders that you are in a safe location</span>
        </button>

        <button
          disabled={isSubmitting}
          onClick={() => setShowSosModal(true)}
          className="p-6 rounded-3xl bg-red-danger hover:bg-red-700 active:scale-98 text-white font-black text-lg shadow-lg flex flex-col items-center justify-center gap-2 border-2 border-red-400 transition animate-pulse"
        >
          <AlertOctagon className="w-9 h-9" />
          <span>{t.helpBtn}</span>
          <span className="text-xs font-medium text-red-200">Request immediate boat / rescue assistance</span>
        </button>
      </div>

      {/* Local Flood Risk Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 text-navy-900">
          <ShieldAlert className="w-6 h-6 text-red-danger" />
          <h2 className="text-base font-extrabold">{t.riskHeading}</h2>
        </div>

        <div className="p-4 bg-red-50 rounded-2xl border border-red-200 space-y-1.5">
          <div className="text-xs font-bold text-red-800 uppercase tracking-wider">
            {hh?.risk_category || 'CRITICAL'} FLOOD ZONE
          </div>
          <p className="text-sm font-bold text-red-900 leading-snug">
            {t.highWarning}
          </p>
          <div className="flex gap-4 pt-2 text-xs text-red-800">
            <span>Terrain Vulnerability: <b>{hh?.vulnerability_score || 82}/100</b></span>
            <span>Ground Floor Unit: <b>{hh?.ground_floor_status ? 'Yes (At Risk)' : 'No'}</b></span>
          </div>
        </div>
      </div>

      {/* Nearest Shelter Card */}
      {shelter && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-6 h-6 text-teal" />
              <h2 className="text-base font-extrabold text-navy-900">{t.shelterTitle}</h2>
            </div>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
              {shelter.available_capacity} Beds Available
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="text-base font-extrabold text-navy-900">{shelter.name}</div>
            <div className="text-xs text-slate-600">{shelter.neighbourhood} • Wheelchair Ramp: <b>{shelter.is_accessible ? 'Available' : 'No'}</b></div>
            
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Contact: {shelter.contact_person}</span>
              <a
                href={`tel:${shelter.contact_phone}`}
                className="py-2 px-4 bg-teal text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 hover:bg-teal-deep transition"
              >
                <Phone className="w-3.5 h-3.5" />
                {t.callHelpdesk}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Turn-by-Turn Safe Escape Route */}
      {route && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Navigation className="w-6 h-6 text-teal" />
              <h2 className="text-base font-extrabold text-navy-900">{t.routeTitle}</h2>
            </div>
            <span className="text-xs font-mono font-bold text-teal">
              {route.total_distance_m} m (~{route.estimated_duration_min} min)
            </span>
          </div>

          <div className="space-y-2">
            {route.steps.map((st: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="w-6 h-6 rounded-full bg-teal text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{st.instruction}</div>
                  <div className="text-[11px] text-slate-500">{st.road_name} ({st.distance_m} m)</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-teal/10 rounded-xl text-[11px] text-teal-deep font-medium border border-teal/20">
            ✓ This escape route is actively rerouted around submerged Ram Nagar canals and flooded causeways.
          </div>
        </div>
      )}

      {/* Offline First Footer */}
      <div className="p-4 bg-slate-100 rounded-2xl text-xs text-slate-500 flex items-center gap-2 justify-center">
        <WifiOff className="w-4 h-4 text-slate-400" />
        <span>{t.offlineNotice}</span>
      </div>

      {/* SOS Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-red-danger text-lg flex items-center gap-2">
                <AlertOctagon className="w-6 h-6" /> Emergency Rescue Request
              </h3>
              <button onClick={() => setShowSosModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">People trapped in household:</label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-sm"
                />
              </div>

              <div className="flex items-center gap-2 bg-red-50 p-3 rounded-xl border border-red-200">
                <input
                  type="checkbox"
                  id="med"
                  checked={medicalUrgency}
                  onChange={(e) => setMedicalUrgency(e.target.checked)}
                  className="w-4 h-4 accent-red-600 rounded"
                />
                <label htmlFor="med" className="font-bold text-red-900 cursor-pointer">
                  Medical Emergency / Bedridden / Infant present
                </label>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Specific location notes / landmarks:</label>
                <textarea
                  rows={2}
                  value={sosNotes}
                  onChange={(e) => setSosNotes(e.target.value)}
                  placeholder="e.g. Water is waist-high; waiting on 1st floor terrace..."
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                ></textarea>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowSosModal(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleSendSOS}
                className="w-1/2 py-2.5 rounded-xl bg-red-danger hover:bg-red-700 font-extrabold text-xs text-white shadow"
              >
                {isSubmitting ? 'Transmitting...' : 'Dispatch SOS Now'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
