import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/index.css';
import '../css/icons.css';

interface LoginFormData {
  username: string;
  password: string;
}


// Dummy user configuration (no backend session)
const DUMMY_USER = {
  id: 1,
  name: 'Andi',
  username: 'andi',
  dr_id_number: '202501',
  email: 'andi@example.com'
};

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const saved = localStorage.getItem('user');
      if (saved) {
        const from = location.state?.from?.pathname || '/history';
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.log('Auth check failed:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Username dan password harus diisi');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Dummy authentication: match against fixed credentials
      if (formData.username === DUMMY_USER.username && formData.password === '1234') {
        localStorage.setItem('user', JSON.stringify(DUMMY_USER));

        // Small delay to ensure storage is set before redirect
        setTimeout(() => {
          const from = location.state?.from?.pathname || '/history';
          navigate(from, { replace: true });
        }, 250);
      } else {
        setError('Username atau password salah');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat login. Silakan coba lagi.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToOverview = () => {
    navigate('/');
  };

  const handleNavigateToModel = () => {
    navigate('/model');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mainBlue to-suBlue p-5 relative overflow-hidden">
      {/* Background fundus image */}
      <img
        src="/content/bg_fundus.png"
        width={700}
        height={700}
        alt="Background Fundus"
        className="absolute top-1/2 right-0 transform -translate-y-1/2 opacity-20 z-0 pointer-events-none"
      />

      <div className="bg-mainWhite rounded-3xl shadow-2xl p-10 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-heading text-mainBlue mb-2 font-bold">
            Login
          </h1>
          <p className="text-paragraph text-gray-600">
            Masuk ke aplikasi CAD Glaucoma
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-semibold text-mainBlue">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Masukkan username"
              required
              disabled={isLoading}
              className="w-full px-4 py-3 border-2 border-lightBlue rounded-xl text-base transition-colors duration-200 focus:outline-none focus:border-mainBlue disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-semibold text-mainBlue">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Masukkan password"
                required
                disabled={isLoading}
                className="w-full px-4 py-3 pr-12 border-2 border-lightBlue rounded-xl text-base transition-colors duration-200 focus:outline-none focus:border-mainBlue disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                disabled={isLoading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-mainBlue transition-colors duration-200 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-xl">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-lightRed/20 border border-mainRed text-mainRed px-4 py-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-mainRed hover:bg-lightRed text-white font-bold py-3 px-6 rounded-xl text-base transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            disabled={isLoading}
          >
            {isLoading ? 'Memproses...' : 'Login'}
          </button>
        </form>

        {/* Navigation Buttons */}
        <div className="mt-8 space-y-3">
          <div className="text-center text-sm text-gray-500 mb-4">
            Atau jelajahi aplikasi tanpa login
          </div>

          <div className="text-lg m-auto flex justify-center gap-5">
            <button
              onClick={handleNavigateToOverview}
              className="text-xl pb-1 cursor-pointer border-b-2 border-transparent hover:border-mainRed text-mainBlue hover:text-mainRed transition-colors duration-200"
            >
              Overview
            </button>

            <button
              onClick={handleNavigateToModel}
              className="text-xl pb-1 cursor-pointer border-b-2 border-transparent hover:border-mainRed text-mainBlue hover:text-mainRed transition-colors duration-200"
            >
              Uji Model
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;