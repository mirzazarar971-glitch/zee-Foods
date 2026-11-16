import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import usePageTitle from '../hooks/usePageTitle';
import AuthShell from '../components/auth/AuthShell';
import Button from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { normalizePhone } from '../lib/format';

export default function Register() {
  usePageTitle('Create account');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '';
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (form.phone && !/^(\+?92|0)?3\d{9}$/.test(normalizePhone(form.phone))) {
      next.phone = 'Enter a valid mobile number, e.g. 03001234567.';
    }
    if (form.password.length < 6) next.password = 'Use at least 6 characters.';
    if (form.password !== form.confirm) next.confirm = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: normalizePhone(form.phone),
        password: form.password,
      });
      toast.success(`Account created — welcome, ${user.name.split(' ')[0]}!`);
      navigate(redirect || '/account', { replace: true });
    } catch (error) {
      toast.error(error.message);
      if (/email/i.test(error.message)) setErrors((prev) => ({ ...prev, email: error.message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Join the table"
      title="Create your Zee Foods account"
      description="One account for faster checkout, saved addresses and live order tracking."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="font-bold text-brand-600 hover:text-brand-700"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" htmlFor="name" error={errors.name}>
          <div className="relative">
            <UserRound size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              id="name"
              required
              autoComplete="name"
              value={form.name}
              onChange={set('name')}
              placeholder="Ali Raza"
              className="input pl-11"
            />
          </div>
        </Field>

        <Field label="Email address" htmlFor="email" error={errors.email}>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              className="input pl-11"
            />
          </div>
        </Field>

        <Field label="Mobile number (optional)" htmlFor="phone" error={errors.phone} hint="Speeds up checkout and order updates.">
          <div className="relative">
            <Phone size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              id="phone"
              inputMode="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="0300 1234567"
              className="input pl-11"
            />
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" htmlFor="password" error={errors.password}>
            <div className="relative">
              <LockKeyhole size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={form.password}
                onChange={set('password')}
                placeholder="Min. 6 characters"
                className="input pl-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-ink-400 transition hover:bg-cream-100 hover:text-ink-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>
          <Field label="Confirm password" htmlFor="confirm" error={errors.confirm}>
            <input
              id="confirm"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={form.confirm}
              onChange={set('confirm')}
              placeholder="Repeat password"
              className="input"
            />
          </Field>
        </div>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Create account
        </Button>

        <p className="text-center text-[11px] leading-relaxed text-ink-400">
          Your details stay with Zee Foods. We never sell or share customer information.
        </p>
      </form>
    </AuthShell>
  );
}
