import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    // Mock auth — accept any credentials
    navigate('/');
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[#020B46] px-4">
      {/* Logo */}
      <img src="/ww-glyph.svg" alt="WeightWatchers" className="h-28 mb-3 brightness-0 invert" />
      <p className="text-white/60 text-sm mb-10">Workshop Scheduler</p>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl">
        <h1 className="text-xl font-semibold text-ww-navy text-center mb-6">Sign in</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            autoFocus
          />

          {/* Password */}
          <InputField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={setPassword}
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
            className="w-full h-12 mt-2 bg-ww-blue text-white font-semibold rounded-full hover:bg-ww-navy transition-colors cursor-pointer"
          >
            Sign in
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Forgot password?{' '}
          <button type="button" className="text-ww-blue hover:underline cursor-pointer">
            Reset it
          </button>
        </p>
      </div>

      <p className="text-white/30 text-xs mt-8">&copy; 2026 WeightWatchers</p>
    </div>
  );
}

function InputField({ label, value, onChange, trailing, ...props }) {
  const [focused, setFocused] = useState(false);
  const hasValue = value !== '';
  const showLabel = focused || hasValue;

  return (
    <div
      className={`w-full h-[54px] rounded-2xl border px-4 flex items-center gap-2 transition-all bg-white ${
        focused
          ? 'border-ww-blue shadow-[0_0_0_3px_rgba(2,34,208,0.1)]'
          : hasValue
            ? 'border-ww-blue'
            : 'border-slate-200'
      }`}
    >
      <div className="flex-1 flex flex-col justify-center">
        {showLabel && (
          <label className="text-[11px] text-ww-blue leading-tight">{label}</label>
        )}
        <input
          {...props}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={showLabel ? '' : label}
          className="w-full outline-none text-sm font-medium bg-transparent text-ww-navy placeholder:text-slate-400"
        />
      </div>
      {trailing}
    </div>
  );
}
