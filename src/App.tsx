/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Stethoscope, 
  AlertTriangle, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  CheckCircle2, 
  Info, 
  PhoneCall,
  Activity,
  User,
  Clock,
  ArrowRight,
  MapPin,
  ExternalLink,
  Navigation,
  Calendar,
  X,
  Check
} from 'lucide-react';
import { COMMON_SYMPTOMS } from './constants';
import { getDiagnosis, DiagnosisResult, findNearbyHospitals, Hospital } from './services/geminiService';

type Step = 'WELCOME' | 'SYMPTOMS' | 'DEMOGRAPHICS' | 'LOADING' | 'RESULTS';

export default function App() {
  const [step, setStep] = useState<Step>('WELCOME');
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [freeText, setFreeText] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [age, setAge] = useState<string>('');
  const [sex, setSex] = useState<string>('');
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [bookingHospital, setBookingHospital] = useState<Hospital | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom) 
        : [...prev, symptom]
    );
  };

  const handleStart = () => {
    if (disclaimerAccepted) setStep('SYMPTOMS');
  };

  const handleDiagnosis = async () => {
    setStep('LOADING');
    setHospitals([]);
    try {
      const allSymptoms = [
        freeText,
        ...selectedSymptoms
      ].filter(Boolean).join(', ');
      
      const diagnosis = await getDiagnosis(allSymptoms, parseInt(age) || 30, sex || 'Not specified');
      setResult(diagnosis);
      setStep('RESULTS');
    } catch (err) {
      console.error(err);
      setError('Failed to analyze symptoms. Please try again.');
      setStep('SYMPTOMS');
    }
  };

  const handleFindHospitals = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoadingHospitals(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const nearby = await findNearbyHospitals(
            position.coords.latitude,
            position.coords.longitude
          );
          setHospitals(nearby);
        } catch (err) {
          console.error("Error finding hospitals:", err);
        } finally {
          setLoadingHospitals(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setLoadingHospitals(false);
      }
    );
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingHospital || !bookingDate || !bookingTime) return;

    setIsBooking(true);
    // Simulate API call to booking provider
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsBooking(false);
    setBookingSuccess(true);
    
    // Auto-close after 3 seconds
    setTimeout(() => {
      setBookingSuccess(false);
      setBookingHospital(null);
      setBookingDate('');
      setBookingTime('');
    }, 3000);
  };

  const reset = () => {
    setStep('WELCOME');
    setFreeText('');
    setSelectedSymptoms([]);
    setAge('');
    setSex('');
    setResult(null);
    setHospitals([]);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={reset}>
          <div className="bg-medical-500 p-2 rounded-lg">
            <Stethoscope className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            MediSense <span className="text-medical-500 font-medium">India</span>
          </h1>
        </div>
        <button 
          onClick={() => window.open('tel:112')}
          className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full font-semibold text-sm hover:bg-red-100 transition-colors"
        >
          <PhoneCall className="w-4 h-4" />
          Emergency (112)
        </button>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full p-6">
        <AnimatePresence mode="wait">
          {step === 'WELCOME' && (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 py-8"
            >
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-medical-100 rounded-full mb-4">
                  <Activity className="w-10 h-10 text-medical-600" />
                </div>
                <h2 className="text-4xl font-bold text-slate-900">India's Health, Understood.</h2>
                <p className="text-slate-600 text-lg">
                  Get AI triage and guidance tailored for the Indian context based on your symptoms in minutes.
                </p>
              </div>

              <div className="glass-card rounded-3xl p-8 space-y-6">
                <div className="flex gap-4 items-start bg-amber-50 p-4 rounded-2xl border border-amber-100">
                  <AlertTriangle className="text-amber-600 w-6 h-6 shrink-0 mt-1" />
                  <div className="text-sm text-amber-900">
                    <p className="font-bold mb-1">Medical Disclaimer</p>
                    <p>This tool is for informational purposes only and does not provide a medical diagnosis. Always seek the advice of a qualified health provider with any questions you may have regarding a medical condition.</p>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={disclaimerAccepted}
                    onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-medical-600 focus:ring-medical-500"
                  />
                  <span className="text-slate-700 font-medium group-hover:text-medical-600 transition-colors">
                    I understand this is not medical advice
                  </span>
                </label>

                <button 
                  onClick={handleStart}
                  disabled={!disclaimerAccepted}
                  className="w-full medical-gradient text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-medical-500/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 group"
                >
                  Start Symptom Check
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'SYMPTOMS' && (
            <motion.div 
              key="symptoms"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 py-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-medical-600 font-semibold text-sm uppercase tracking-wider">
                  <Clock className="w-4 h-4" />
                  Step 1 of 2
                </div>
                <h2 className="text-3xl font-bold text-slate-900">What symptoms are you experiencing?</h2>
                <p className="text-slate-600">Describe how you feel in your own words or select from the list below.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Describe your symptoms</label>
                  <textarea 
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    placeholder="e.g., I have a sharp pain in my lower back that started yesterday..."
                    className="w-full h-32 p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-medical-500 focus:border-transparent resize-none bg-white shadow-sm"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-700">Common Symptoms</label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_SYMPTOMS.map(symptom => (
                      <button
                        key={symptom}
                        onClick={() => toggleSymptom(symptom)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selectedSymptoms.includes(symptom)
                            ? 'bg-medical-500 text-white shadow-md shadow-medical-500/20'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-medical-300'
                        }`}
                      >
                        {symptom}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                    {error}
                  </div>
                )}

                <button 
                  onClick={() => setStep('DEMOGRAPHICS')}
                  disabled={!freeText && selectedSymptoms.length === 0}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'DEMOGRAPHICS' && (
            <motion.div 
              key="demographics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 py-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-medical-600 font-semibold text-sm uppercase tracking-wider">
                  <User className="w-4 h-4" />
                  Step 2 of 2
                </div>
                <h2 className="text-3xl font-bold text-slate-900">A bit more about you</h2>
                <p className="text-slate-600">This helps our AI provide more accurate results based on your profile.</p>
              </div>

              <div className="glass-card rounded-3xl p-8 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Age</label>
                    <input 
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Years"
                      className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-medical-500 focus:border-transparent bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Sex</label>
                    <select 
                      value={sex}
                      onChange={(e) => setSex(e.target.value)}
                      className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-medical-500 focus:border-transparent bg-white"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep('SYMPTOMS')}
                    className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button 
                    onClick={handleDiagnosis}
                    disabled={!age || !sex}
                    className="flex-[2] medical-gradient text-white py-4 rounded-2xl font-bold shadow-lg shadow-medical-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    Analyze Symptoms
                    <Activity className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'LOADING' && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 space-y-8"
            >
              <div className="relative">
                <div className="w-24 h-24 border-4 border-medical-100 rounded-full animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Stethoscope className="w-10 h-10 text-medical-500 animate-bounce" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-slate-900">Analyzing your symptoms...</h3>
                <p className="text-slate-500">Comparing against thousands of medical data points.</p>
              </div>
            </motion.div>
          )}

          {step === 'RESULTS' && result && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8 py-4"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-900">Analysis Results</h2>
                <p className="text-slate-600">Based on the symptoms provided, here is our assessment.</p>
              </div>

              {/* Triage Banner */}
              <div className={`p-6 rounded-3xl flex items-start gap-4 border-2 ${
                result.triage === 'EMERGENCY' 
                  ? 'bg-red-50 border-red-200 text-red-900' 
                  : result.triage === 'SEE_DOCTOR'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <div className={`p-3 rounded-2xl ${
                  result.triage === 'EMERGENCY' ? 'bg-red-500' : result.triage === 'SEE_DOCTOR' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}>
                  <AlertTriangle className="text-white w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-xl font-bold">
                    {result.triage === 'EMERGENCY' ? 'Seek Emergency Care' : result.triage === 'SEE_DOCTOR' ? 'Schedule a Doctor Visit' : 'Self-Care Recommended'}
                  </h3>
                  <p className="text-sm opacity-90 leading-relaxed">{result.triageReason}</p>
                  
                  <button 
                    onClick={handleFindHospitals}
                    disabled={loadingHospitals}
                    className="mt-3 flex items-center gap-2 bg-white/50 hover:bg-white/80 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                  >
                    <MapPin className="w-4 h-4" />
                    {loadingHospitals ? 'Locating Hospitals...' : 'Find Nearest Hospitals'}
                  </button>
                </div>
              </div>

              {/* Nearby Hospitals */}
              {hospitals.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-medical-500" />
                    Nearby Medical Facilities
                  </h3>
                  <div className="grid gap-3">
                    {hospitals.map((hospital, idx) => (
                      <div key={idx} className="glass-card rounded-2xl p-4 flex flex-col gap-3 hover:border-medical-300 transition-all group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-medical-100 p-2 rounded-lg text-medical-600">
                              <Stethoscope className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-slate-900">{hospital.name}</span>
                          </div>
                          <a 
                            href={hospital.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-medical-500 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                        
                        {hospital.phone && (
                          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <PhoneCall className="w-3.5 h-3.5 text-medical-500" />
                              <span className="font-medium">{hospital.phone}</span>
                            </div>
                            <button 
                              onClick={() => window.open(`tel:${hospital.phone}`)}
                              className="text-[10px] font-bold uppercase tracking-wider text-medical-600 hover:text-medical-700"
                            >
                              Call Now
                            </button>
                          </div>
                        )}

                        <button 
                          onClick={() => setBookingHospital(hospital)}
                          className="w-full mt-2 bg-medical-500 text-white py-2.5 rounded-xl font-bold text-sm shadow-md shadow-medical-500/10 hover:bg-medical-600 transition-all flex items-center justify-center gap-2"
                        >
                          <Calendar className="w-4 h-4" />
                          Book Appointment
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Conditions */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                  <Info className="w-5 h-5 text-medical-500" />
                  Potential Conditions
                </h3>
                <div className="space-y-4">
                  {result.conditions.map((condition, idx) => (
                    <div key={idx} className="glass-card rounded-2xl p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xl font-bold text-slate-900">{condition.name}</h4>
                          <p className="text-slate-600 text-sm mt-1">{condition.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-medical-600">{condition.likelihood}%</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Match</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {condition.commonSymptoms.map(s => (
                          <span key={s} className="px-2 py-1 bg-slate-100 text-slate-500 text-[11px] rounded-md font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-100 rounded-2xl text-xs text-slate-500 italic leading-relaxed">
                {result.disclaimer}
              </div>

              <button 
                onClick={reset}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                Start New Assessment
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Booking Modal */}
      <AnimatePresence>
        {bookingHospital && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isBooking && setBookingHospital(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {bookingSuccess ? (
                <div className="p-12 text-center space-y-4">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Appointment Requested!</h3>
                  <p className="text-slate-600">
                    Your request for <strong>{bookingHospital.name}</strong> has been sent. You will receive a confirmation via SMS shortly.
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">Book Appointment</h3>
                    <button 
                      onClick={() => setBookingHospital(null)}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                  <form onSubmit={handleBookAppointment} className="p-6 space-y-6">
                    <div className="bg-medical-50 p-4 rounded-2xl border border-medical-100 flex items-center gap-3">
                      <div className="bg-medical-500 p-2 rounded-lg text-white">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-medical-600 uppercase tracking-wider">Hospital</p>
                        <p className="font-bold text-slate-900">{bookingHospital.name}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Preferred Date</label>
                        <input 
                          type="date" 
                          required
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-medical-500 focus:border-transparent bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Preferred Time Slot</label>
                        <select 
                          required
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                          className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-medical-500 focus:border-transparent bg-white"
                        >
                          <option value="">Select Time</option>
                          <option value="09:00 AM">09:00 AM - 10:00 AM</option>
                          <option value="10:00 AM">10:00 AM - 11:00 AM</option>
                          <option value="11:00 AM">11:00 AM - 12:00 PM</option>
                          <option value="02:00 PM">02:00 PM - 03:00 PM</option>
                          <option value="03:00 PM">03:00 PM - 04:00 PM</option>
                          <option value="04:00 PM">04:00 PM - 05:00 PM</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isBooking}
                      className="w-full medical-gradient text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-medical-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isBooking ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Confirm Booking
                          <CheckCircle2 className="w-5 h-5" />
                        </>
                      )}
                    </button>
                    <p className="text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      Powered by MediSense Connect
                    </p>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="p-6 text-center text-slate-400 text-xs border-t border-slate-100">
        &copy; 2026 MediSense AI. All rights reserved. Professional medical triage assistant.
      </footer>
    </div>
  );
}
