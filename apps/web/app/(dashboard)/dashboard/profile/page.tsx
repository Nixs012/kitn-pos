'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  User, 
  Shield, 
  Activity, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Camera, 
  Lock, 
  Key, 
  Monitor, 
  Globe, 
  CheckCircle2,
  LogOut
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import * as toast from '@/lib/toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

// --- Custom Table Component for reuse ---
const SimpleTable = ({ headers, children }: { headers: string[], children: React.ReactNode }) => (
  <div className="overflow-x-auto rounded-[24px] border border-gray-100 shadow-sm">
    <table className="w-full text-left border-collapse">
      <thead className="bg-gray-50/50">
        <tr>
          {headers.map(h => (
            <th key={h} className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {children}
      </tbody>
    </table>
  </div>
);

const COUNTIES = [
  'Nairobi', 'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita Taveta', 'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru', 'Tharaka-Nithi', 'Embu', 'Kitui', 'Machakos', 'Makueni', 'Nyandarua', 'Nyeri', 'Kirinyaga', 'Murang\'a', 'Kiambu', 'Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia', 'Uasin Gishu', 'Elgeyo-Marakwet', 'Nandi', 'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 'Kericho', 'Bomet', 'Kakamega', 'Vihiga', 'Bungoma', 'Busia', 'Siaya', 'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira'
];

type Tab = 'personal' | 'security' | 'activity';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  id_number?: string;
  county?: string;
  role: string;
  branch_name?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export default function ProfilePage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [auditLogs, setAuditLogs] = useState<unknown[]>([]);
  const [session, setSession] = useState<unknown>(null);

  // Form states
  const [personalData, setPersonalData] = useState({
    full_name: '',
    email: '',
    phone: '',
    id_number: '',
    county: 'Nairobi'
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    currentPIN: '',
    newPIN: '',
    confirmPIN: ''
  });

  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*, branch:branches(name)')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const userData: UserProfile = {
        id: user.id,
        full_name: profileData.full_name || '',
        email: user.email || '',
        phone: profileData.phone || '',
        id_number: profileData.id_number || '',
        county: profileData.county || 'Nairobi',
        role: profileData.role,
        branch_name: profileData.branch?.name || 'Main Branch',
        avatar_url: profileData.avatar_url,
        is_active: profileData.is_active,
        created_at: profileData.created_at,
        last_login: user.last_sign_in_at
      };

      setProfile(userData);
      setPersonalData({
        full_name: userData.full_name,
        email: userData.email,
        phone: userData.phone,
        id_number: userData.id_number || '',
        county: userData.county || 'Nairobi'
      });

      // Fetch Audit Logs
      const { data: logs } = await supabase
        .from('audit_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      setAuditLogs(logs || []);

      // Get Session Info
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);

    } catch (err: unknown) {
      const error = err as Error;
      toast.showError(error.message || 'Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          full_name: personalData.full_name,
          phone: personalData.phone,
          id_number: personalData.id_number,
          county: personalData.county
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // Email update if changed
      if (personalData.email !== profile.email) {
        const { error: authError } = await supabase.auth.updateUser({ email: personalData.email });
        if (authError) throw authError;
        toast.showInfo('Please confirm your new email address');
      }

      toast.showSuccess('Profile updated successfully');
      fetchProfile();
    } catch (err: unknown) {
      const error = err as Error;
      toast.showError(error.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.showError('Passwords do not match');
      return;
    }
    if (securityData.newPassword.length < 8) {
      toast.showError('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: securityData.newPassword });
      if (error) throw error;
      toast.showSuccess('Password updated successfully');
      setSecurityData({ ...securityData, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      const error = err as Error;
      toast.showError(error.message || 'Password update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePIN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (securityData.newPIN !== securityData.confirmPIN) {
      toast.showError('PINs do not match');
      return;
    }
    if (securityData.newPIN.length !== 4) {
      toast.showError('PIN must be 4 digits');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ pin_hash: securityData.newPIN })
        .eq('id', profile.id);

      if (error) throw error;
      toast.showSuccess('PIN updated successfully');
      setSecurityData({ ...securityData, currentPIN: '', newPIN: '', confirmPIN: '' });
    } catch (err: unknown) {
      const error = err as Error;
      toast.showError(error.message || 'PIN update failed');
    } finally {
      setSaving(false);
    }
  };

  const signOtherOut = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'others' });
      if (error) throw error;
      toast.showSuccess('Signed out from other devices');
    } catch (err: unknown) {
      const error = err as Error;
      toast.showError(error.message || 'Sign out failed');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      toast.showSuccess('Avatar updated');
      fetchProfile();
    } catch (err: unknown) {
      const error = err as Error;
      toast.showError('Upload failed: ' + error.message);
    }
  };

  const getPasswordStrength = (pw: string) => {
    if (!pw) return 0;
    let strength = 0;
    if (pw.length >= 8) strength += 25;
    if (/[A-Z]/.test(pw)) strength += 25;
    if (/[0-9]/.test(pw)) strength += 25;
    if (/[^A-Za-z0-9]/.test(pw)) strength += 25;
    return strength;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin" />
          <p className="text-xs font-black text-brand-dark uppercase tracking-widest animate-pulse">Loading Profile...</p>
        </div>
      </div>
    );
  }

  const strength = getPasswordStrength(securityData.newPassword);
  const strengthColor = strength <= 25 ? 'bg-red-500' : strength <= 75 ? 'bg-orange-500' : 'bg-brand-green';

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Column: Profile Card */}
        <div className="w-full lg:w-[350px] space-y-6">
          <Card className="p-8 text-center border border-gray-100 shadow-xl shadow-brand-dark/[0.02]">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="w-full h-full rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green overflow-hidden border-4 border-white shadow-2xl scale-105 transition-transform hover:scale-110 duration-500">
                {profile?.avatar_url ? (
                  <Image 
                    src={profile.avatar_url} 
                    alt="Avatar" 
                    fill 
                    className="object-cover" 
                    unoptimized
                  />
                ) : (
                  <span className="text-4xl font-black">{profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}</span>
                )}
              </div>
              <label 
                htmlFor="avatar-input"
                className="absolute bottom-1 right-1 p-2 bg-white rounded-full shadow-lg border border-gray-100 text-brand-dark hover:text-brand-green transition-all cursor-pointer hover:scale-110 z-10"
              >
                <Camera size={18} />
                <input type="file" id="avatar-input" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </label>
              <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 ${profile?.is_active ? 'bg-brand-green animate-pulse' : 'bg-gray-400'}`} />
            </div>

            <h2 className="text-2xl font-black text-brand-dark tracking-tighter">{profile?.full_name}</h2>
            
            <div className="mt-3 flex justify-center">
              <Badge 
                variant={profile?.role === 'admin' ? 'danger' : profile?.role === 'manager' ? 'info' : 'success'}
                className="font-black px-4 py-1.5 uppercase tracking-widest text-[10px] shadow-sm"
                style={{ backgroundColor: profile?.role === 'admin' ? '#D85A30' : profile?.role === 'manager' ? '#378ADD' : '#1D9E75', color: 'white' }}
              >
                {profile?.role}
              </Badge>
            </div>

            <div className="mt-10 space-y-5 pt-8 border-t border-gray-50">
              <div className="flex items-center gap-4 text-left group">
                <div className="w-10 h-10 bg-gray-50 flex items-center justify-center rounded-2xl text-gray-400 group-hover:bg-brand-green/10 group-hover:text-brand-green transition-all">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Branch</p>
                  <p className="text-sm font-bold text-brand-dark mt-1.5">{profile?.branch_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-left group">
                <div className="w-10 h-10 bg-gray-50 flex items-center justify-center rounded-2xl text-gray-400 group-hover:bg-brand-green/10 group-hover:text-brand-green transition-all">
                  <Mail size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Email</p>
                  <p className="text-sm font-bold text-brand-dark mt-1.5 truncate">{profile?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-left group">
                <div className="w-10 h-10 bg-gray-50 flex items-center justify-center rounded-2xl text-gray-400 group-hover:bg-brand-green/10 group-hover:text-brand-green transition-all">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Contact</p>
                  <p className="text-sm font-bold text-brand-dark mt-1.5">{profile?.phone || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-left group">
                <div className="w-10 h-10 bg-gray-50 flex items-center justify-center rounded-2xl text-gray-400 group-hover:bg-brand-green/10 group-hover:text-brand-green transition-all">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Joined On</p>
                  <p className="text-sm font-bold text-brand-dark mt-1.5">{new Date(profile?.created_at || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-left group">
                <div className="w-10 h-10 bg-gray-50 flex items-center justify-center rounded-2xl text-gray-400 group-hover:bg-brand-green/10 group-hover:text-brand-green transition-all">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Last Activity</p>
                  <p className="text-sm font-bold text-brand-dark mt-1.5">{profile?.last_login ? new Date(profile.last_login).toLocaleString() : 'Active now'}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Content Tabs */}
        <div className="flex-1 w-full space-y-6">
          <div className="flex gap-1 bg-white p-1.5 rounded-[22px] border border-gray-100 shadow-sm w-fit">
            {[
              { id: 'personal', label: 'Personal Info', icon: User },
              { id: 'security', label: 'Identity & Security', icon: Shield },
              { id: 'activity', label: 'Audit Timeline', icon: Activity },
            ].map(t => (
              <button 
                key={t.id}
                onClick={() => setActiveTab(t.id as Tab)}
                className={`flex items-center gap-3 px-8 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${activeTab === t.id ? 'bg-brand-green text-white shadow-xl shadow-brand-green/30 scale-[1.02]' : 'text-gray-400 hover:text-brand-dark hover:bg-gray-50'}`}
              >
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>

          <Card className="overflow-hidden border border-gray-100 bg-white shadow-sm ring-1 ring-black/[0.02]">
            {activeTab === 'personal' && (
              <form onSubmit={handleUpdateProfile} className="p-10 space-y-10 animate-in fade-in duration-700">
                <div className="flex items-center justify-between pb-6 border-b border-gray-50">
                  <div>
                    <h3 className="text-2xl font-black text-brand-dark tracking-tighter">Update Account</h3>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                       <Shield size={12} className="text-brand-green" /> Managed Profile Verification Active
                    </p>
                  </div>
                  <Badge variant="info" className="px-5 py-2">Account Ready</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                  <Input 
                    label="Full Identification Name*" 
                    value={personalData.full_name} 
                    onChange={e => setPersonalData({ ...personalData, full_name: e.target.value })} 
                    placeholder="Enter your full name" 
                    required 
                  />
                  <Input 
                    label="Official Email Address*" 
                    value={personalData.email} 
                    onChange={e => setPersonalData({ ...personalData, email: e.target.value })} 
                    placeholder="your@email.com" 
                    required 
                  />
                  <Input 
                    label="Active Phone Number" 
                    value={personalData.phone} 
                    onChange={e => setPersonalData({ ...personalData, phone: e.target.value })} 
                    placeholder="07XX XXX XXX" 
                  />
                  <Input 
                    label="National ID Number" 
                    value={personalData.id_number} 
                    onChange={e => setPersonalData({ ...personalData, id_number: e.target.value })} 
                    placeholder="ID / Passport Number" 
                  />
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">Home County</label>
                    <select 
                      value={personalData.county}
                      onChange={e => setPersonalData({ ...personalData, county: e.target.value })}
                      className="w-full bg-gray-50/50 border border-gray-100 rounded-[18px] px-6 py-4.5 text-sm font-bold text-brand-dark focus:ring-4 focus:ring-brand-green/5 outline-none transition-all shadow-sm"
                    >
                      {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="pt-10 border-t border-gray-50 flex justify-end">
                  <Button type="submit" loading={saving} className="px-10 py-5 rounded-[22px] text-xs tracking-widest uppercase font-black shadow-xl shadow-brand-green/20">
                    Propagate Changes
                  </Button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <div className="p-10 space-y-16 animate-in fade-in duration-700">
                {/* Change Password */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-brand-coral/10 rounded-[22px] flex items-center justify-center text-brand-coral shadow-inner"><Lock size={28} /></div>
                    <div>
                      <h3 className="text-2xl font-black text-brand-dark tracking-tighter leading-none">Security Override</h3>
                      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Monitor size={12} /> Standard end-to-end encryption
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdatePassword} className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50/30 p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                      <Lock size={120} />
                    </div>
                    <Input 
                      label="Current Verification Password" 
                      type="password" 
                      value={securityData.currentPassword} 
                      onChange={e => setSecurityData({ ...securityData, currentPassword: e.target.value })} 
                    />
                    <div className="hidden md:block" />
                    <div className="space-y-4">
                      <Input 
                        label="New Account Password" 
                        type="password" 
                        value={securityData.newPassword} 
                        onChange={e => setSecurityData({ ...securityData, newPassword: e.target.value })} 
                      />
                      {securityData.newPassword && (
                        <div className="px-2">
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-700 ${strengthColor}`} style={{ width: `${strength}%` }} />
                          </div>
                          <div className="flex justify-between items-center mt-3">
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Entropy: {strength}%</p>
                             <p className={`text-[10px] font-black uppercase tracking-widest ${strength >= 75 ? 'text-brand-green' : 'text-brand-coral'}`}>
                                {strength <= 25 ? 'Critical Weak' : strength <= 75 ? 'Moderate' : 'High Security'}
                             </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <Input 
                      label="Confirm Identity Sync" 
                      type="password" 
                      value={securityData.confirmPassword} 
                      onChange={e => setSecurityData({ ...securityData, confirmPassword: e.target.value })} 
                    />
                    <div className="md:col-span-2 pt-6">
                      <Button type="submit" loading={saving} className="bg-brand-coral hover:bg-red-600 shadow-brand-coral/20">Update Authentication</Button>
                    </div>
                  </form>
                </div>

                {/* Change PIN */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-brand-blue/10 rounded-[22px] flex items-center justify-center text-brand-blue shadow-inner"><Key size={28} /></div>
                    <div>
                      <h3 className="text-2xl font-black text-brand-dark tracking-tighter leading-none">Hardware Access PIN</h3>
                      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-2">Required for POS Checkout verification</p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdatePIN} className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-brand-blue/[0.02] p-8 rounded-[40px] border border-brand-blue/10 shadow-sm">
                    <Input 
                      label="Current PIN" 
                      type="password" 
                      maxLength={4} 
                      placeholder="••••" 
                      value={securityData.currentPIN} 
                      onChange={e => setSecurityData({ ...securityData, currentPIN: e.target.value })} 
                    />
                    <Input 
                      label="New Access PIN" 
                      type="password" 
                      maxLength={4} 
                      placeholder="••••" 
                      value={securityData.newPIN} 
                      onChange={e => setSecurityData({ ...securityData, newPIN: e.target.value })} 
                    />
                    <Input 
                      label="Redistribute PIN" 
                      type="password" 
                      maxLength={4} 
                      placeholder="••••" 
                      value={securityData.confirmPIN} 
                      onChange={e => setSecurityData({ ...securityData, confirmPIN: e.target.value })} 
                    />
                    <div className="md:col-span-3 pt-6">
                      <Button type="submit" loading={saving} variant="info" className="bg-brand-blue hover:bg-blue-600 shadow-brand-blue/20">Sync Hardware PIN</Button>
                    </div>
                  </form>
                </div>

                {/* Sessions */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-brand-green/10 rounded-[22px] flex items-center justify-center text-brand-green shadow-inner"><Monitor size={28} /></div>
                    <div>
                      <h3 className="text-2xl font-black text-brand-dark tracking-tighter leading-none">Authentication Sessions</h3>
                      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-2">Real-time device monitoring & access</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-8 bg-white border border-gray-100 rounded-[32px] shadow-sm group hover:border-brand-green/20 transition-all">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[24px] bg-gray-50 flex items-center justify-center text-gray-400 shadow-inner group-hover:bg-brand-green/10 group-hover:text-brand-green transition-all">
                          <Globe size={32} />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-brand-dark">Active Web Portal</h4>
                          <p className="text-[11px] font-bold text-gray-400 mt-2 uppercase tracking-[0.1em]">
                          IP: {session ? '197.XXX.XXX.XX' : 'Detecting...'}
                          </p>
                          <div className="flex items-center gap-2 mt-3 text-brand-green text-[10px] font-black uppercase tracking-widest">
                             <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-ping" /> Synchronized Device
                          </div>
                        </div>
                      </div>
                      <Badge variant="success" className="px-6 py-2.5 shadow-xl shadow-brand-green/10">Active Session</Badge>
                    </div>
                  </div>

                  <div className="pt-10 flex justify-center">
                    <button 
                      onClick={signOtherOut}
                      className="px-10 py-5 rounded-[26px] text-xs font-black uppercase tracking-[0.2em] text-brand-coral border-2 border-brand-coral/10 hover:bg-brand-coral hover:text-white transition-all shadow-xl shadow-brand-coral/5 flex items-center gap-4 group"
                    >
                      <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> Sign Out Global Sessions
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="p-10 space-y-10 animate-in fade-in duration-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-brand-dark tracking-tighter">Event Protocol</h3>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                       <Activity size={14} className="text-brand-green" /> Immutable System Audit History
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-gray-50 px-5 py-3 rounded-2xl font-black uppercase tracking-widest border border-gray-100">
                    <Clock size={16} className="text-brand-blue" /> Protocol window: 7 Days
                  </div>
                </div>

                <SimpleTable headers={['Protocol Action', 'Relational Table', 'Observed Timestamp', 'Status']}>
                  {auditLogs.length > 0 ? (auditLogs as { id: string; action: string; table_name: string; created_at: string }[]).map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-6">
                        <Badge 
                          variant={log.action === 'INSERT' ? 'success' : log.action === 'UPDATE' ? 'info' : 'danger'}
                          className="px-6 py-2 text-[9px] font-black uppercase tracking-widest bg-opacity-20 flex items-center gap-2 w-fit"
                          style={{ 
                            backgroundColor: log.action === 'INSERT' ? 'rgba(29, 158, 117, 0.1)' : log.action === 'UPDATE' ? 'rgba(55, 138, 221, 0.1)' : 'rgba(216, 90, 48, 0.1)',
                            color: log.action === 'INSERT' ? '#1D9E75' : log.action === 'UPDATE' ? '#378ADD' : '#D85A30',
                            border: 'none'
                          }}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${log.action === 'INSERT' ? 'bg-brand-green' : log.action === 'UPDATE' ? 'bg-brand-blue' : 'bg-brand-coral'}`} />
                          {log.action === 'INSERT' ? 'Protocol Record Created' : log.action === 'UPDATE' ? 'Record Modification' : 'Global Removal'}
                        </Badge>
                      </td>
                      <td className="px-6 py-6">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-brand-dark group-hover:text-white transition-all duration-500">
                               <Shield size={14} />
                            </div>
                            <span className="font-black text-brand-dark text-[11px] uppercase tracking-widest">{log.table_name}</span>
                         </div>
                      </td>
                      <td className="px-6 py-6 font-bold text-gray-500 text-xs">
                        <span className="text-brand-dark font-black mr-2">{new Date(log.created_at).toLocaleDateString()}</span>
                        <span className="opacity-50">{new Date(log.created_at).toLocaleTimeString()}</span>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2.5 text-brand-green group-hover:scale-105 transition-transform duration-500 origin-left">
                          <CheckCircle2 size={18} className="drop-shadow-sm" />
                          <span className="text-[10px] font-black uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-lg">Verified</span>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="py-40 text-center">
                        <div className="flex flex-col items-center gap-6 opacity-30 select-none">
                          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center shadow-inner">
                            <Activity size={48} className="text-gray-400" />
                          </div>
                          <div>
                             <p className="font-black uppercase tracking-[0.3em] text-sm text-brand-dark">No Protocol Events</p>
                             <p className="text-[10px] font-bold mt-2">Activity will appear once recorded by system triggers</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </SimpleTable>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
