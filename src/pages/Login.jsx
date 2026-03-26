import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import Input from '../components/ui/Input';

function WwLogo({ className, animate }) {
  const anim = (name, delay = '0.3s', easing = 'ease-out') => animate ? {
    animation: `${name} 0.7s ${easing} ${delay} both`,
  } : undefined;

  return (
    <svg className={className} viewBox="0 0 74 74" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g style={anim('ww-left')}>
        <path d="M14.9507 20.8125L14.3988 42.3256H14.0098L13.3144 20.8125H7.58112L6.9295 42.3158H6.50401L5.98855 20.8125H0L2.69886 53.7289H9.59189L10.1244 34.9706H10.545L11.0775 53.7289H17.8417L20.5405 20.8125H14.9507Z" fill="currentColor"/>
      </g>
      <g style={anim('ww-right')}>
        <path d="M68.4102 20.8125L67.8583 42.3256H67.4692L66.7714 20.8125H61.0382L60.3866 42.3158H59.9611L59.4456 20.8125H53.4571L56.1559 53.7289H63.049L63.5839 34.9706H64.0021L64.537 53.7289H71.3011L74 20.8125H68.4102Z" fill="currentColor"/>
      </g>
      <rect
        x="22.6093" y="32.3651"
        width="28.7781" height="5.2202"
        fill="currentColor"
        style={animate ? {
          transformBox: 'fill-box',
          transformOrigin: 'center',
          animation: 'ww-dash 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both',
        } : undefined}
      />
    </svg>
  );
}

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loginState, setLoginState] = useState('idle'); // idle | loading | success

  const [bgLoaded, setBgLoaded] = useState(false);
  const fullText = 'Workshop Scheduler';
  const [typedCount, setTypedCount] = useState(0);

  useEffect(() => {
    const img = new Image();
    img.src = '/login-bg.png';
    img.onload = () => setBgLoaded(true);
  }, []);

  useEffect(() => {
    if (!bgLoaded || typedCount >= fullText.length) return;
    const timeout = setTimeout(() => setTypedCount((c) => c + 1), 60);
    return () => clearTimeout(timeout);
  }, [bgLoaded, typedCount]);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoginState('loading');

    setTimeout(() => {
      onLogin();
      setLoginState('success');
      setTimeout(() => navigate('/'), 800);
    }, 1200);
  }

  const isSubmitting = loginState !== 'idle';

  if (!bgLoaded) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#020B46]">
        <WwLogo className="h-28 mb-6 text-[#0222D0]" />
        <Loader2 size={24} className="animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[#020B46] bg-[url('/login-bg.png')] bg-cover bg-center px-4 animate-[fadeIn_0.4s_ease-out]">
      {/* Logo */}
      <WwLogo className="h-28 mb-3 text-[#0222D0]" animate />
      <p className="text-white/60 text-sm mb-10">
        {fullText.slice(0, typedCount)}
        {typedCount < fullText.length && <span className="animate-pulse">|</span>}
      </p>

      {/* Card */}
      <div className="w-full max-w-sm bg-gray-50 rounded-3xl p-8 shadow-xl">
        <h1 className="text-xl font-semibold text-ww-navy text-center mb-6">Sign in</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-slate-400 hover:text-ww-blue transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          {error && (
            <p className="text-sm text-ww-coral text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full h-12 mt-2 font-semibold rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
              loginState === 'success'
                ? 'bg-emerald-700 text-white'
                : 'bg-ww-blue text-white hover:bg-[#1a3ad8]'
            } ${isSubmitting ? 'pointer-events-none' : ''}`}
          >
            {loginState === 'idle' && 'Sign in'}
            {loginState === 'loading' && (
              <>
                <Loader2 size={18} className="animate-spin" />
                Signing you in...
              </>
            )}
            {loginState === 'success' && (
              <>
                <Check size={18} strokeWidth={3} />
                Welcome!
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs mt-6">
          <button type="button" className="text-ww-blue hover:underline cursor-pointer">
            Forgot password?
          </button>
        </p>
      </div>

      <p className="text-white/30 text-xs mt-8">&copy; 2026 Weight Watchers</p>
    </div>
  );
}
