import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { getErrorMessage } from '../utils/errors';
import { Banknote } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      const msg = getErrorMessage(err, 'Invalid email or password');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-blush px-4 py-10 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-burgundy-deep text-white shadow-sm">
            <Banknote className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-charcoal">Welcome back</h1>
          <p className="text-sm text-muted">Sign in to access your Silver Bank account</p>
        </div>
        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Email address"
              type="email"
              name="email"
              placeholder="you@silverbank.com"
              value={form.email}
              onChange={handleChange}
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-burgundy-wine hover:text-burgundy-deep">
              Open an account
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Login;
