import React, { useState, useEffect } from 'react';
import { User as UserIcon, Lock, LogIn, Eye, EyeOff, AlertCircle, Store, Shield } from 'lucide-react';
import { User, Role } from '../types';
import { api } from '../services/api';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userList, setUserList] = useState<User[]>([]);

  // Fetch users list to support check & auto-fill list
  useEffect(() => {
    api.getUsers()
      .then(users => {
        setUserList(users);
      })
      .catch(err => {
        console.error('Failed to load user list for login view:', err);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username dan password harus diisi!');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const users = await api.getUsers();
      const matchedUser = users.find(
        u => u.username.toLowerCase() === username.trim().toLowerCase() && u.active
      );

      if (!matchedUser) {
        setError('Username tidak terdaftar atau tidak aktif!');
        setIsLoading(false);
        return;
      }

      // Read password from mock database (fallback to username if password field doesn't exist)
      const expectedPassword = matchedUser.password || matchedUser.username;

      if (password !== expectedPassword) {
        setError('Password yang Anda masukkan salah!');
        setIsLoading(false);
        return;
      }

      // Authentication logs record action
      const logItem = {
        id: 'log_auth_' + Date.now(),
        timestamp: new Date().toISOString(),
        user: matchedUser.name,
        role: matchedUser.role,
        action: `Berhasil login ke sistem sebagai ${matchedUser.role}`,
        branchId: matchedUser.branchId === 'all' ? 'b1' : matchedUser.branchId,
        ip: '192.168.10.22'
      };
      
      // Perform success login callback
      onLoginSuccess(matchedUser);

    } catch (err: any) {
      setError('Terjadi kesalahan jaringan atau database.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutofill = (selectedUser: User) => {
    setUsername(selectedUser.username);
    setPassword(selectedUser.password || selectedUser.username);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 md:p-8" id="login_container">
      {/* Absolute floating background accents */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-950/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl p-6 sm:p-8 z-10" id="login_card">
        
        {/* Brand visual header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 p-2 text-slate-950 mb-4 shadow-lg shadow-teal-500/20">
            <Store className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">NUSANTARA POS</h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">Sistem Pemantauan Cabang Ganda & Kasir Serverless</p>
        </div>

        {/* Error Notification Alert */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-xs text-rose-400" id="login_error_alert">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username (e.g. admin)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-teal-500 transition-colors"
                id="login_username_input"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password Anda"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-teal-500 transition-colors"
                id="login_password_input"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                id="toggle_password_visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs py-3 px-4 rounded-xl cursor-pointer shadow-md shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 mt-2"
            id="login_submit_btn"
          >
            <LogIn className="w-4 h-4 shrink-0" />
            <span>{isLoading ? 'Memproses Masuk...' : 'Masuk Aplikasi POS'}</span>
          </button>
        </form>

        {/* Demo Credentials Helper Shortcuts Area */}
        <div className="mt-8 border-t border-slate-800 pt-6">
          <div className="flex items-center gap-1.5 mb-3 text-slate-400">
            <Shield className="w-3.5 h-3.5 text-teal-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Demo Akses Akun</h3>
          </div>
          <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
            Klik profil demo berikut untuk mengisi formulir otomatis:
          </p>

          <div className="grid grid-cols-2 gap-2" id="demo_accounts_grid">
            {userList.length === 0 ? (
              // Hardcoded fallbacks if fetch has delays
              [
                { name: 'Super Admin', username: 'admin', role: Role.ADMIN, displayRole: 'Admin' },
                { name: 'ndy (Owner)', username: 'owner', role: Role.OWNER, displayRole: 'Owner' },
                { name: 'Aisyah (lahat)', username: 'kasir1', role: Role.CASHIER, displayRole: 'Kasir Lahat' },
                { name: 'Beni (Pagar alam)', username: 'kasir2', role: Role.CASHIER, displayRole: 'Kasir Pagar alam' }
              ].map((fallbackUsr, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setUsername(fallbackUsr.username);
                    setPassword(fallbackUsr.username); // matches username
                    setError('');
                  }}
                  type="button"
                  className="p-2 border border-slate-800/80 bg-slate-900/60 hover:bg-slate-800 rounded-lg text-left transition-all hover:border-slate-700 cursor-pointer group"
                >
                  <p className="text-[10px] font-bold text-slate-300 truncate group-hover:text-teal-400">{fallbackUsr.name}</p>
                  <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                    <span>user: {fallbackUsr.username}</span>
                  </div>
                </button>
              ))
            ) : (
              userList.map((usr) => (
                <button
                  key={usr.id}
                  onClick={() => handleAutofill(usr)}
                  type="button"
                  className="p-2 border border-slate-800/80 bg-slate-900/60 hover:bg-slate-800 rounded-lg text-left transition-all hover:border-slate-700 cursor-pointer group"
                >
                  <p className="text-[10px] font-bold text-slate-300 truncate group-hover:text-teal-400">{usr.name}</p>
                  <div className="flex justify-between items-center text-[9px] text-slate-500 mt-1">
                    <span>{usr.username}</span>
                    <span className="bg-slate-800 px-1 rounded text-[8px] font-bold text-teal-400 truncate tracking-tight">{usr.role}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
