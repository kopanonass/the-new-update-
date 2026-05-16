import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, User, Mail, CreditCard, Hash, Key, Check, LogOut, History as HistoryIcon, MessageSquare, Sun, Moon, Palette, Layers, ChevronRight, Camera, Trash2, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface ProfileViewProps {
  user: any;
  onBack: () => void;
  theme: 'dark' | 'light' | 'white' | 'dim';
  onUpdateUser: (updatedUser: any) => void;
}

export function ProfileView({ user, onBack, theme, onUpdateUser }: ProfileViewProps) {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setAvatarLoading(true);
      try {
        const response = await fetch('/api/profile/avatar', {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('orbit_token')}`
          },
          body: JSON.stringify({ avatarUrl: base64String })
        });
        if (response.ok) {
          const updatedUser = { ...user, avatarUrl: base64String };
          onUpdateUser(updatedUser);
          localStorage.setItem('orbit_user', JSON.stringify(updatedUser));
        }
      } catch (err) {
        console.error("Avatar update failed:", err);
      } finally {
        setAvatarLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = async () => {
    setAvatarLoading(true);
    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('orbit_token')}`
        },
        body: JSON.stringify({ avatarUrl: null })
      });
      if (response.ok) {
        const updatedUser = { ...user, avatarUrl: null };
        onUpdateUser(updatedUser);
        localStorage.setItem('orbit_user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error("Avatar removal failed:", err);
    } finally {
      setAvatarLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      // In a real app, this would hit the API
      // Since we already have a reset password flow in server.ts, we can reuse it
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, newPassword, otp: '123456' }) // OTP simulation for simplicity or dedicated endpoint
      });
      if (response.ok) {
        setMessage('Password updated successfully!');
        setIsChangingPassword(false);
      } else {
        setMessage('Failed to update password');
      }
    } catch {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-zinc-500/20 pb-6">
        <button onClick={onBack} className="p-2 hover:bg-zinc-500/10 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none" aria-label="Go back to home">
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="text-3xl font-black tracking-tight">Your Profile</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 flex flex-col items-center text-center space-y-6">
          <div className="relative group">
            <div className="w-40 h-40 bg-yellow-400 rounded-3xl overflow-hidden flex items-center justify-center text-5xl shadow-2xl shadow-yellow-400/20 border-4 border-white/10">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                "🍌"
              )}
              {avatarLoading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                  <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 flex flex-col gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-zinc-100 text-black rounded-2xl shadow-xl hover:bg-white active:scale-90 transition-all border border-zinc-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
                title="Upload Photo"
                aria-label="Upload profile photo"
              >
                <Camera size={20} aria-hidden="true" />
              </button>
              {user?.avatarUrl && (
                <button 
                  onClick={removeAvatar}
                  className="p-3 bg-red-500 text-white rounded-2xl shadow-xl hover:bg-red-600 active:scale-90 transition-all border border-red-400 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
                  title="Remove Photo"
                  aria-label="Remove profile photo"
                >
                  <Trash2 size={20} aria-hidden="true" />
                </button>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarUpload}
            />
          </div>
          <div>
            <h2 className="text-2xl font-black">{user?.name || 'Student'}</h2>
            <p className="text-zinc-500 text-sm font-medium">{user?.email}</p>
          </div>
          <div className="bg-yellow-400/10 text-yellow-500 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-yellow-400/20">
            Certified Pro Student
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoCard icon={User} label="Name" value={user?.name} />
            <InfoCard icon={User} label="Surname" value={user?.surname} />
            <InfoCard icon={Mail} label="Email" value={user?.email} />
            <InfoCard icon={CreditCard} label="ID Number" value={user?.idNumber} />
            <InfoCard icon={Hash} label="Student Number" value={user?.studentNumber} />
          </div>

          <div className="bg-zinc-500/5 rounded-2xl p-6 border border-zinc-500/10">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Key size={18} className="text-yellow-400" />
              Security
            </h3>
            
            {isChangingPassword ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="new-password" className="sr-only">New Password</label>
                    <input 
                      id="new-password"
                      type="password" 
                      placeholder="New Password" 
                      className="w-full bg-black/20 border border-zinc-500/20 rounded-xl px-4 py-2 text-sm focus:border-yellow-400 outline-none focus-visible:ring-1 focus-visible:ring-yellow-400"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
                    <input 
                      id="confirm-password"
                      type="password" 
                      placeholder="Confirm Password" 
                      className="w-full bg-black/20 border border-zinc-500/20 rounded-xl px-4 py-2 text-sm focus:border-yellow-400 outline-none focus-visible:ring-1 focus-visible:ring-yellow-400"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handlePasswordReset}
                    disabled={loading}
                    className="bg-yellow-400 text-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-yellow-500 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
                  >
                    {loading ? 'Updating...' : 'Save Password'} <Check size={16} aria-hidden="true" />
                  </button>
                  <button 
                    onClick={() => setIsChangingPassword(false)}
                    className="text-zinc-500 px-4 py-2 rounded-xl text-sm font-bold hover:bg-zinc-500/10 transition-colors focus-visible:ring-2 focus-visible:ring-zinc-500"
                  >
                    Cancel
                  </button>
                </div>
                {message && <p className="text-xs text-yellow-500 font-bold" aria-live="polite">{message}</p>}
              </div>
            ) : (
              <button 
                onClick={() => setIsChangingPassword(true)}
                className="w-full text-left p-4 hover:bg-zinc-500/10 rounded-xl transition-colors flex items-center justify-between group"
              >
                <div>
                  <p className="font-medium">Change Password</p>
                  <p className="text-xs text-zinc-500">Update your account security credentials</p>
                </div>
                <ChevronRight size={20} className="text-zinc-500 group-hover:text-yellow-400 transition-colors" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="p-4 bg-zinc-500/5 rounded-2xl border border-zinc-500/10 space-y-1">
      <div className="flex items-center gap-2 text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
        <Icon size={12} />
        {label}
      </div>
      <p className="font-semibold">{value || 'N/A'}</p>
    </div>
  );
}

interface SettingsViewProps {
  theme: 'dark' | 'light' | 'white' | 'dim';
  onThemeChange: (theme: 'dark' | 'light' | 'white' | 'dim') => void;
  accentColor: string;
  onAccentColorChange: (color: string) => void;
  accentStyle: 'static' | 'flow';
  onAccentStyleChange: (style: 'static' | 'flow') => void;
  fontStyle: 'sans' | 'editorial' | 'tech';
  onFontStyleChange: (style: 'sans' | 'editorial' | 'tech') => void;
  onBack: () => void;
}

export function SettingsView({ 
  theme, 
  onThemeChange, 
  accentColor,
  onAccentColorChange,
  accentStyle,
  onAccentStyleChange,
  fontStyle,
  onFontStyleChange,
  onBack 
}: SettingsViewProps) {
  const themes = [
    { id: 'dark', label: 'Dark', icon: Moon, color: 'bg-zinc-950', border: 'border-zinc-800' },
    { id: 'dim', label: 'Dim', icon: Palette, color: 'bg-zinc-800', border: 'border-zinc-700' },
    { id: 'light', label: 'Light', icon: Sun, color: 'bg-zinc-100', border: 'border-zinc-300' },
    { id: 'white', label: 'White', icon: Layers, color: 'bg-white', border: 'border-zinc-200' },
  ] as const;

  const accents = [
    { id: '#eab308', label: 'Banana', color: 'bg-yellow-400' },
    { id: '#3b82f6', label: 'Ocean', color: 'bg-blue-500' },
    { id: '#22c55e', label: 'Forest', color: 'bg-green-500' },
    { id: '#ec4899', label: 'Candy', color: 'bg-pink-500' },
    { id: '#a855f7', label: 'Royal', color: 'bg-purple-500' },
    { id: '#f97316', label: 'Sunset', color: 'bg-orange-500' },
  ];

  const presets = [
    { name: 'Cyberpunk', theme: 'dark', accent: '#ec4899', style: 'flow', font: 'tech' },
    { name: 'Midnight', theme: 'dim', accent: '#3b82f6', style: 'flow', font: 'sans' },
    { name: 'Golden Aura', theme: 'dark', accent: '#eab308', style: 'flow', font: 'editorial' },
    { name: 'Clean Minimal', theme: 'white', accent: '#3b82f6', style: 'static', font: 'sans' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-zinc-500/20 pb-6">
        <button onClick={onBack} className="p-2 hover:bg-zinc-500/10 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none" aria-label="Go back to home">
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="text-3xl font-black tracking-tight">Personalization</h1>
      </div>

      {/* Top Presets */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles size={20} className="text-yellow-400" />
            Top Style Presets
          </h2>
          <p className="text-zinc-500 text-sm">One-tap premium visual configurations</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {presets.map((p) => (
            <button
              key={p.name}
              onClick={() => {
                onThemeChange(p.theme as any);
                onAccentColorChange(p.accent);
                onAccentStyleChange(p.style as any);
                onFontStyleChange(p.font as any);
              }}
              className="p-4 bg-zinc-500/5 border border-zinc-500/10 rounded-2xl hover:border-yellow-400/50 hover:bg-yellow-400/5 transition-all text-center group"
            >
              <p className="font-black text-xs uppercase tracking-widest">{p.name}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sun size={20} className="text-yellow-400" />
            Base Theme
          </h2>
          <p className="text-zinc-500 text-sm">Control the overall brightness of the interface</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => onThemeChange(t.id)}
              className={cn(
                "p-4 rounded-2xl border-2 transition-all text-center space-y-3 group",
                theme === t.id ? "border-yellow-400 shadow-xl shadow-yellow-400/10" : "border-zinc-500/10 hover:border-zinc-500/30"
              )}
            >
              <div className={cn("w-12 h-12 rounded-xl mx-auto flex items-center justify-center border", t.color, t.border)}>
                <t.icon size={20} className={cn(t.id === 'light' || t.id === 'white' ? "text-zinc-900" : "text-zinc-100")} />
              </div>
              <p className={cn("font-bold text-sm", theme === t.id ? "text-yellow-400" : "text-zinc-500")}>
                {t.label}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Accent Color */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold">Accent Color</h3>
              <p className="text-zinc-500 text-xs">Choose your primary interface highlights</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {accents.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onAccentColorChange(a.id)}
                  style={{ backgroundColor: a.id }}
                  className={cn(
                    "w-10 h-10 rounded-full transition-all border-4 relative",
                    accentColor === a.id ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                  title={a.label}
                >
                  {accentColor === a.id && <Check size={16} className="absolute inset-0 m-auto text-white drop-shadow-md" />}
                </button>
              ))}
            </div>
            <div className="pt-2">
               <Toggle 
                label="Enable Animated Flow" 
                checked={accentStyle === 'flow'}
                onToggle={() => onAccentStyleChange(accentStyle === 'flow' ? 'static' : 'flow')}
               />
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold">Typography</h3>
              <p className="text-zinc-500 text-xs">Customize the identity through text</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'sans', label: 'Standard Sans', desc: 'Clean and modern' },
                { id: 'editorial', label: 'Editorial Sans', desc: 'Bold and authoritative' },
                { id: 'tech', label: 'Cyber Tech', desc: 'Monospace and technical' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => onFontStyleChange(f.id as any)}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all",
                    fontStyle === f.id ? "border-yellow-400 bg-yellow-400/5" : "border-zinc-500/10 hover:border-zinc-500/30"
                  )}
                >
                  <p className={cn("font-bold text-sm", f.id === 'editorial' && "tracking-tight text-lg", f.id === 'tech' && "font-mono")}>
                    {f.label}
                  </p>
                  <p className="text-[10px] text-zinc-500">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="p-6 bg-yellow-400/5 rounded-3xl border border-yellow-400/10 space-y-4">
        <h3 className="font-bold flex items-center gap-2">
          <Check size={18} className="text-yellow-400" />
          General Preferences
        </h3>
        <div className="space-y-3">
          <Toggle label="Enable haptic feedback" checked={false} onToggle={() => {}} />
          <Toggle label="Smart summarization mode" checked={true} onToggle={() => {}} />
          <Toggle label="Save chat history locally" checked={true} onToggle={() => {}} />
        </div>
      </section>
    </div>
  );
}

function Toggle({ label, checked, onToggle }: { label: string, checked: boolean, onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium">{label}</span>
      <button 
        onClick={onToggle}
        aria-label={label}
        aria-pressed={checked}
        className={cn(
          "w-10 h-5 rounded-full transition-all relative focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          checked ? "bg-accent" : "bg-zinc-500/30"
        )}
      >
        <div className={cn(
          "absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm",
          checked ? "left-6" : "left-1"
        )} />
      </button>
    </div>
  );
}

interface HistoryViewProps {
  chats: any[];
  onSelectChat: (id: string) => void;
  onBack: () => void;
  theme: string;
}

export function HistoryView({ chats, onSelectChat, onBack, theme }: HistoryViewProps) {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-zinc-500/20 pb-6">
        <button onClick={onBack} className="p-2 hover:bg-zinc-500/10 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none" aria-label="Go back to home">
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="text-3xl font-black tracking-tight">Chat History</h1>
      </div>

      {chats.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-zinc-500/5 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 grayscale">
            💬
          </div>
          <h2 className="text-xl font-bold">No history found</h2>
          <p className="text-zinc-500 text-sm">Start your first conversation today!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className="p-6 bg-zinc-500/5 border border-zinc-500/10 rounded-3xl text-left hover:border-yellow-400/50 hover:bg-yellow-400/5 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-yellow-400/10 text-yellow-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-bold truncate max-w-[200px]">{chat.title}</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Conversation</p>
                </div>
              </div>
              <p className="text-sm text-zinc-500 line-clamp-2 italic">
                {chat.messages?.[chat.messages.length - 1]?.content || 'Empty conversation'}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
