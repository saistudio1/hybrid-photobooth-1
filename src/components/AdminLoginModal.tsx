import React, { useState } from 'react';
import { Lock, X, KeyRound, ShieldAlert, Check } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PROTOTYPE_ADMIN_PIN = '111101';

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMessage('Masukkan password admin terlebih dahulu.');
      return;
    }

    if (password === PROTOTYPE_ADMIN_PIN) {
      setErrorMessage('');
      setPassword('');
      onSuccess();
    } else {
      setErrorMessage('Password salah. Silakan periksa kembali dan coba lagi.');
      setPassword('');
    }
  };

  const handleClose = () => {
    setPassword('');
    setErrorMessage('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
      style={{ backgroundColor: 'var(--overlay-bg)' }}
    >
      <div className="glass-panel rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-500 shadow-md">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Login Operator / Admin</h3>
              <p className="text-[11px] text-[var(--text-muted)]">Akses khusus pengelola photobooth</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl glass-button hover:opacity-80"
          >
            <X className="w-4 h-4 text-[var(--text-primary)]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-[var(--text-primary)] block mb-1.5 flex items-center justify-between">
              <span>Password Admin</span>
              <span className="text-[10px] text-[var(--text-muted)] font-normal">Karakter disamarkan</span>
            </label>
            <div className="relative">
              <input
                type="password"
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Masukkan 6 digit password"
                className="w-full px-4 py-3 rounded-xl themed-input text-sm tracking-widest"
              />
              <KeyRound className="w-4 h-4 text-[var(--text-muted)] absolute right-3.5 top-3.5 pointer-events-none" />
            </div>

            {errorMessage && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 glass-button rounded-xl text-xs font-semibold hover:opacity-80 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-neutral-950 font-extrabold rounded-xl text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4 text-neutral-950" />
              <span>Masuk Admin</span>
            </button>
          </div>
        </form>

        <p className="text-[10px] text-center text-[var(--text-muted)] mt-4">
          Akses terlindungi untuk pengelolaan template, tema, dan format cetak.
        </p>
      </div>
    </div>
  );
};
