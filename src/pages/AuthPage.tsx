import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, User, Phone, Building2, UserCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t, LANGUAGES, type Lang } from '../lib/i18n';

export default function AuthPage() {
  const { signIn, signUp, lang, setLang } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('asha');
  const [phone, setPhone] = useState('');
  const [facility, setFacility] = useState('');
  const [language, setLanguage] = useState(lang);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) throw new Error(error);
        navigate('/');
      } else {
        const { error } = await signUp(email, password, {
          full_name: fullName,
          role,
          phone,
          facility,
          language,
        });
        if (error) throw new Error(error);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
        <div className="relative flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t(lang, 'appName')}</h1>
              <p className="text-sm text-primary-100">{t(lang, 'tagline')}</p>
            </div>
          </div>

          <div className="space-y-6 max-w-md">
            <h2 className="text-3xl font-bold leading-tight">
              Healthcare for every village, powered by technology.
            </h2>
            <p className="text-primary-100 text-base leading-relaxed">
              Connecting ASHA workers, doctors, and patients across rural India with telemedicine,
              AI-assisted diagnosis, maternal care tracking, and government scheme access.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              {[
                { label: 'Patients Managed', value: '2,400+' },
                { label: 'Villages Connected', value: '180' },
                { label: 'Consultations', value: '15,000+' },
                { label: 'Vaccinations', value: '8,500+' },
              ].map((s) => (
                <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-primary-100">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-primary-200">Trusted by rural health workers across India</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{t(lang, 'appName')}</h1>
              <p className="text-xs text-gray-500">{t(lang, 'tagline')}</p>
            </div>
          </div>

          <div className="card p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {mode === 'signin' ? t(lang, 'signInToContinue') : t(lang, 'createAccount')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {mode === 'signin' ? t(lang, 'signIn') : t(lang, 'signUp')} to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="label">{t(lang, 'fullName')}</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input className="input pl-10" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Dr. Anjali Sharma" />
                  </div>
                </div>
              )}

              <div>
                <label className="label">{t(lang, 'email')}</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="email" className="input pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@health.gov.in" />
                </div>
              </div>

              <div>
                <label className="label">{t(lang, 'password')}</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="password" className="input pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
                </div>
              </div>

              {mode === 'signup' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">{t(lang, 'role')}</label>
                      <div className="relative">
                        <UserCircle className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
                        <select className="input pl-10" value={role} onChange={(e) => setRole(e.target.value)}>
                          <option value="asha">{t(lang, 'asha')}</option>
                          <option value="doctor">{t(lang, 'doctor')}</option>
                          <option value="admin">{t(lang, 'admin')}</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="label">{t(lang, 'language')}</label>
                      <select className="input" value={language} onChange={(e) => { setLanguage(e.target.value as Lang); setLang(e.target.value as Lang); }}>
                        {LANGUAGES.map((l) => (
                          <option key={l.code} value={l.code}>{l.native}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">{t(lang, 'phone')}</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input className="input pl-10" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" />
                      </div>
                    </div>
                    <div>
                      <label className="label">{t(lang, 'facility')}</label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input className="input pl-10" value={facility} onChange={(e) => setFacility(e.target.value)} placeholder="PHC Rampur" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="bg-error-50 border border-error-200 text-error-700 text-sm rounded-lg px-3.5 py-2.5">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? t(lang, 'loading') : mode === 'signin' ? t(lang, 'signIn') : t(lang, 'signUp')}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-5">
              {mode === 'signin' ? (
                <>
                  {t(lang, 'dontHaveAccount')}{' '}
                  <button onClick={() => { setMode('signup'); setError(null); }} className="text-primary-600 font-medium hover:underline">
                    {t(lang, 'signUp')}
                  </button>
                </>
              ) : (
                <>
                  {t(lang, 'alreadyHaveAccount')}{' '}
                  <button onClick={() => { setMode('signin'); setError(null); }} className="text-primary-600 font-medium hover:underline">
                    {t(lang, 'signIn')}
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
