import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, Stethoscope } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t } from '../lib/i18n';

type Msg = { role: 'user' | 'ai'; text: string; timestamp: number };

type SymptomRule = {
  keywords: string[];
  response: string;
  urgency?: 'normal' | 'urgent' | 'emergency';
};

const RULES: SymptomRule[] = [
  {
    keywords: ['chest pain', 'chest pressure', 'tightness in chest'],
    response: 'Chest pain can be life-threatening. Consider this an EMERGENCY if accompanied by sweating, shortness of breath, or pain radiating to the left arm or jaw. Call emergency services (108) immediately. While waiting: keep patient calm, seated upright, loosen clothing. If the patient has prescribed nitroglycerin and BP is not low, assist them to take it. Do NOT delay for teleconsultation — refer to the nearest facility with ECG capability.',
    urgency: 'emergency',
  },
  {
    keywords: ['difficulty breathing', 'shortness of breath', 'breathless', 'dyspnea', 'wheezing'],
    response: 'Assess the breathing pattern: rate, depth, use of accessory muscles. Check SpO2 if pulse oximeter available. If SpO2 < 90% or patient is struggling to breathe — this is urgent. Position the patient upright. If known asthma/COPD, assist with prescribed inhaler (salbutamol). Check for associated symptoms: fever (pneumonia?), swelling (heart failure?), recent trauma (pneumothorax?). Refer urgently if no improvement.',
    urgency: 'urgent',
  },
  {
    keywords: ['fever'],
    response: 'Fever workup: Measure temperature. If ≥39°C, give Paracetamol 500mg (adults) or weight-appropriate pediatric dose. Check for: malaria (RDT/smear in endemic areas), dengue (NS1 antigen, platelet count), typhoid (Widal/culture), urinary infection (dipstick). Look for danger signs: stiff neck (meningitis), rash (dengue/measles), reduced urine output (severe dehydration). Advise oral hydration. Follow up in 48 hours if no improvement.',
  },
  {
    keywords: ['diarrhea', 'loose motion', 'loose stool'],
    response: 'Diarrhea management: Start ORS immediately — 1 packet in 1 liter clean water, frequent small sips. Assess dehydration: mild (thirst, dry mouth), moderate (sunken eyes, decreased skin turgor), severe (lethargy, no urine, shock). For children, add Zinc supplementation (20mg/day for 10-14 days). Check for blood in stool (dysentery — consider antibiotics). Continue feeding. Refer to facility if severe dehydration, persistent vomiting, or blood in stool.',
  },
  {
    keywords: ['cough'],
    response: 'Cough assessment: Determine duration — acute (<3 weeks) is commonly viral or bacterial URTI. Chronic (>3 weeks) requires TB screening (sputum AFB, Chest X-ray), especially with weight loss, night sweats, or hemoptysis. Check breath sounds, respiratory rate. If wheeze present, consider bronchodilator. If productive with fever, consider antibiotics (Amoxicillin). Advise steam inhalation, hydration, and honey for children >1 year.',
  },
  {
    keywords: ['pregnan', 'antenatal', 'anc', 'fetal movement'],
    response: 'Pregnancy-related: Check BP — if ≥140/90, screen for preeclampsia (proteinuria, headache, visual disturbance, swelling). Assess fetal heart rate (normal 110-160 bpm). Ask about fetal movement — reduced movement requires urgent assessment. Check for bleeding, ruptured membranes. Ensure ANC visits are up to date (minimum 4 recommended). Iron-folic acid supplementation should be ongoing. Refer to obstetrician for any danger signs.',
    urgency: 'urgent',
  },
  {
    keywords: ['hypertension', 'high blood pressure', 'high bp'],
    response: 'Elevated BP: Confirm with repeat measurement after 5 minutes rest. If ≥140/90 on two occasions, diagnose hypertension. Counsel on: salt restriction (<5g/day), regular exercise, weight management, avoid tobacco/alcohol. Start antihypertensive per protocol (Amlodipine 5mg is common first-line). Monitor monthly. If BP ≥180/120 (hypertensive emergency) with headache/visual symptoms — refer urgently.',
  },
  {
    keywords: ['diabetes', 'high sugar', 'blood sugar'],
    response: 'Diabetes management: Check fasting and postprandial blood sugar. Targets: fasting 80-130 mg/dL, postprandial <180 mg/dL. Counsel on: balanced diet (reduce refined carbs/sugar), 30 min daily walk, regular medication (Metformin is first-line). Check feet for wounds/ulcers. Annual eye and kidney screening. If blood sugar >400 mg/dL with symptoms of DKA (vomiting, abdominal pain, altered consciousness) — refer urgently.',
  },
  {
    keywords: ['wound', 'injury', 'cut', 'laceration'],
    response: 'Wound care: Clean thoroughly with clean water or antiseptic. Assess depth and contamination. Control bleeding with direct pressure. Deep/wide wounds may need suturing — refer if >1cm or muscle visible. Check tetanus status — booster needed if >5 years since last dose or unknown. Consider antibiotics (Amoxicillin + Metronidazole) if contaminated. Cover with sterile dressing, change daily.',
  },
  {
    keywords: ['snake', 'snakebite', 'bite'],
    response: 'SNAKEBITE: Keep the patient calm and still — movement spreads venom. Immobilize the bitten limb at heart level. Remove rings/watches (swelling). Do NOT cut, suck, apply tourniquet, or give alcohol. Note the time of bite and description of snake. Transport to nearest facility with anti-snake venom (ASV) IMMEDIATELY. Monitor for swelling, bleeding, ptosis, respiratory distress.',
    urgency: 'emergency',
  },
  {
    keywords: ['dehydration', 'dehydration'],
    response: 'Dehydration: Assess severity using pinched skin, dry mouth, sunken eyes, urine output. Mild-moderate: ORS 1-2 liters over 2-4 hours, then maintain. Severe (lethargic, no urine, shock): IV fluids (Normal Saline or Ringer Lactate) — refer to facility. Continue feeding/breastfeeding. Monitor urine output as key indicator of improvement.',
  },
  {
    keywords: ['malaria'],
    response: 'Malaria: Confirm with RDT or blood smear. If positive, start treatment per national guidelines — Artemisinin Combination Therapy (ACT) for uncomplicated falciparum. Check for danger signs: altered consciousness, jaundice, renal failure, pulmonary edema (severe malaria — IV artesunate, refer urgently). Monitor hemoglobin for anemia. Counsel on mosquito net use and prevention.',
  },
  {
    keywords: ['dengue'],
    response: 'Dengue: Monitor platelet count daily. Watch for warning signs: abdominal pain, persistent vomiting, bleeding gums, lethargy, fluid accumulation. Maintain hydration — oral if able, IV if vomiting. No NSAIDs/Aspirin (bleeding risk) — use Paracetamol only. Refer urgently if platelet count <50,000 or any warning signs appear. Critical phase is around defervescence (day 3-7).',
    urgency: 'urgent',
  },
  {
    keywords: ['child', 'pediatric', 'infant'],
    response: 'Pediatric assessment: Use IMCI (Integrated Management of Childhood Illness) approach. Check for general danger signs: unable to drink/breastfeed, vomiting everything, convulsions, lethargy or unconscious. Assess for: fast breathing (pneumonia), diarrhea with dehydration, fever (malaria in endemic areas), malnutrition. Weight-based dosing for all medications. Always verify dose calculations for children.',
  },
  {
    keywords: ['mental health', 'depression', 'anxiety', 'suicidal'],
    response: 'Mental health: Screen for depression using PHQ-2 (2-question screen). If concerns, use PHQ-9 for full assessment. Ask directly about suicidal thoughts if concern exists — if present, do not leave the patient alone, involve family, refer to mental health professional urgently. For anxiety: brief counseling, breathing exercises, identify triggers. Consider SSRI referral for persistent symptoms. Reduce stigma — mental health is health.',
    urgency: 'urgent',
  },
];

const QUICK_PROMPTS = [
  'Fever for 3 days, what should I check?',
  'Patient with high blood pressure',
  'Diarrhea management for a child',
  'Pregnant patient with reduced fetal movement',
];

function generateResponse(input: string): { text: string; urgency?: 'normal' | 'urgent' | 'emergency' } {
  const lower = input.toLowerCase();

  for (const rule of RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) {
      return { text: rule.response, urgency: rule.urgency };
    }
  }

  // Fallback — general clinical guidance
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('help')) {
    return {
      text: 'Hello! I am your AI clinical assistant. I can help with:\n\n• Symptom assessment and differential diagnosis\n• Treatment guidance for common rural health conditions\n• Drug dosing and prescription suggestions\n• Emergency triage and referral decisions\n• Maternal and child health protocols\n\nDescribe the patient\'s symptoms or ask a clinical question to get started.',
    };
  }

  if (lower.includes('dosing') || lower.includes('dose') || lower.includes('medicine') || lower.includes('prescription')) {
    return {
      text: 'For medication dosing, I need to know:\n\n1. The medicine you\'re considering\n2. The patient\'s age and weight (especially for children)\n3. The indication (what condition)\n\nCommon adult doses:\n• Paracetamol: 500mg every 6 hours (max 4g/day)\n• Amoxicillin: 500mg every 8 hours\n• Metformin: 500mg twice daily with meals\n• Amlodipine: 5mg once daily\n• ORS: 1 packet in 1L water, sip frequently\n\nFor children, always calculate by weight. Describe the scenario for specific guidance.',
    };
  }

  return {
    text: `Based on your query "${input}", here is general guidance:\n\n1. Take a complete history: onset, duration, severity, associated symptoms, past medical history.\n2. Perform relevant physical examination and record vitals (BP, HR, Temperature, RR, SpO2).\n3. Consider common conditions for the presentation in the local context.\n4. Start supportive care while working towards a diagnosis.\n5. Refer to a higher facility if danger signs are present or diagnosis is unclear.\n\nFor more specific guidance, try describing the patient's symptoms in detail (e.g., "fever with cough", "pregnant patient with high BP").`,
  };
}

export default function AIAssistant() {
  const { lang } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'ai', text: t(lang, 'aiGreeting'), timestamp: Date.now() },
  ]);
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    const userMsg: Msg = { role: 'user', text: trimmed, timestamp: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const { text: response, urgency } = generateResponse(trimmed);
      const prefix = urgency === 'emergency'
        ? '⚠️ EMERGENCY — '
        : urgency === 'urgent'
        ? '⚠️ URGENT — '
        : '';
      setMessages((m) => [...m, { role: 'ai', text: prefix + response, timestamp: Date.now() }]);
      setTyping(false);
    }, 600 + Math.random() * 400);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-gradient-to-br from-secondary-500 to-secondary-700 text-white px-4 py-3.5 shadow-lg hover:shadow-xl transition-all duration-200 ${open ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
      >
        <div className="relative">
          <Sparkles className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-success-500 rounded-full ring-2 ring-secondary-600 animate-pulse" />
        </div>
        <span className="text-sm font-medium hidden sm:inline">{t(lang, 'aiAssistant')}</span>
      </button>

      {/* Chat panel */}
      <div className={`fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 z-50 ${open ? 'flex' : 'hidden'} flex-col bg-white sm:rounded-2xl shadow-2xl border border-gray-200 w-full sm:w-[420px] h-full sm:h-[600px] sm:max-h-[calc(100vh-2.5rem)] overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-secondary-600 to-secondary-700 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold leading-tight">{t(lang, 'aiAssistant')}</h3>
              <p className="text-[11px] text-secondary-100">{t(lang, 'aiAssistantSub')}</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-secondary-600 text-white'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
              </div>
              <div className={`max-w-[78%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-800 shadow-sm'}`}>
                {msg.text}
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full bg-secondary-600 text-white flex items-center justify-center shrink-0">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Quick prompts */}
        {messages.length <= 1 && !typing && (
          <div className="px-4 py-2.5 border-t border-gray-100 bg-white shrink-0">
            <p className="text-[11px] text-gray-500 mb-1.5 font-medium">{t(lang, 'aiQuickPrompts')}</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-xs px-2.5 py-1.5 rounded-full bg-secondary-50 text-secondary-700 hover:bg-secondary-100 border border-secondary-100 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-3 py-3 border-t border-gray-200 bg-white shrink-0">
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
            <input
              className="input flex-1 text-sm"
              placeholder={t(lang, 'aiInputPlaceholder')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={!input.trim() || typing} className="btn-primary px-3 py-2.5 shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-gray-400 mt-1.5 text-center">{t(lang, 'aiDisclaimer')}</p>
        </div>
      </div>
    </>
  );
}

export { generateResponse as aiGenerateResponse };
