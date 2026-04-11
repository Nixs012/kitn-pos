'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { safeQuery } from '@/lib/supabase/handleError';
import { 
  Store, 
  Users, 
  Smartphone, 
  Plus, 
  Save, 
  Shield, 
  Power,
  MapPin,
  Layout,
  UserPlus,
  ExternalLink,
  ShieldAlert,
  Download,
  RefreshCw,
  Trash2,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import * as toast from '@/lib/toast';

// Components
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { userSchema, pinResetSchema } from '@/lib/validations/schemas';
import FormError from '@/components/ui/FormError';

const COUNTIES = [
  'Nairobi', 'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita Taveta', 'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru', 'Tharaka-Nithi', 'Embu', 'Kitui', 'Machakos', 'Makueni', 'Nyandarua', 'Nyeri', 'Kirinyaga', 'Murang\'a', 'Kiambu', 'Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia', 'Uasin Gishu', 'Elgeyo-Marakwet', 'Nandi', 'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 'Kericho', 'Bomet', 'Kakamega', 'Vihiga', 'Bungoma', 'Busia', 'Siaya', 'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira'
];

const ROLES = [
  { value: 'admin', label: 'Admin', variant: 'danger' },
  { value: 'manager', label: 'Manager', variant: 'info' },
  { value: 'cashier', label: 'Cashier', variant: 'success' },
  { value: 'viewer', label: 'Viewer', variant: 'gray' }
];

interface IUserProfile {
  id: string;
  tenant_id: string;
  branch_id?: string;
  role: string;
  full_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  last_login?: string;
  branches?: { name: string; id: string };
}

interface ICreationDetails {
  full_name: string;
  email: string;
  pin: string;
  password: string;
  url: string;
}

interface ISubscription {
  id: string;
  plan: 'free' | 'basic' | 'pro';
  status: 'trial' | 'active' | 'expired';
  trial_ends_at?: string;
  current_period_end?: string;
  last_payment_amount?: number;
  last_payment_date?: string;
  last_payment_ref?: string;
}

interface ITenant {
  id: string;
  name: string;
  business_type: string;
  county: string;
  phone?: string;
  email?: string;
  address?: string;
  receipt_footer?: string;
  vat_number?: string;
  logo_url?: string;
  subscription_tier?: string;
}

export default function SettingsPage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'store' | 'users' | 'devices' | 'subscription'>('store');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ id: string; role: string; tenant_id: string; branch_id?: string } | null>(null);
  const [tenant, setTenant] = useState<ITenant | null>(null);
  const [users, setUsers] = useState<IUserProfile[]>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [subscription, setSubscription] = useState<ISubscription | null>(null);
  
  // Modal states


  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const user = await safeQuery<{ user: { id: string; email?: string } }>(
        () => supabase.auth.getUser(),
        'get user'
      );
      if (!user) return;

      // 1. Fetch Profile
      const profileData = await safeQuery<IUserProfile>(
        () => supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.user.id)
          .single(),
        'load profile'
      );
      if (!profileData) return;
      setProfile(profileData);

      if (profileData.role !== 'admin') {
        setLoading(false);
        return;
      }

      // 2. Fetch Tenant
      const tenantData = await safeQuery<ITenant>(
        () => supabase
          .from('tenants')
          .select('*')
          .eq('id', profileData.tenant_id)
          .single(),
        'load tenant'
      );
      if (tenantData) setTenant(tenantData);

      // 3. Fetch Users (including new email/phone columns)
      const usersData = await safeQuery<IUserProfile[]>(
        () => supabase
          .from('user_profiles')
          .select('*, branches(name, id)')
          .eq('tenant_id', profileData.tenant_id),
        'load users'
      );
      setUsers(usersData || []);

      // 4. Fetch Branches
      const branchesData = await safeQuery<{ id: string; name: string }[]>(
        () => supabase
          .from('branches')
          .select('*')
          .eq('tenant_id', profileData.tenant_id),
        'load branches'
      );
      setBranches(branchesData || []);

      // 5. Fetch Subscription
      const subData = await safeQuery<ISubscription>(
        () => supabase
          .from('subscriptions')
          .select('*')
          .eq('tenant_id', profileData.tenant_id)
          .single(),
        'load subscription'
      );
      setSubscription(subData);

    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  if (loading) return <div className="p-8 animate-pulse space-y-4"><div className="h-8 bg-gray-100 w-48 rounded" /><div className="h-64 bg-gray-50 rounded-2xl" /></div>;

  if (profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
          <Shield className="text-red-500" size={32} />
        </div>
        <h2 className="text-xl font-black text-brand-dark">Access Denied</h2>
        <p className="text-sm text-gray-400 max-w-xs capitalize font-bold tracking-tight">Only system administrators can manage store settings and user accounts.</p>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-2xl font-black text-brand-dark tracking-tighter flex items-center gap-2">
          Settings & Management
          <div className="w-2 h-2 rounded-full bg-brand-green" />
        </h1>
        <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mt-1">Configure your store and team access</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border-[0.5px] border-gray-200 shadow-sm w-fit">
        <TabButton active={activeTab === 'store'} onClick={() => setActiveTab('store')} icon={<Store size={14}/>}>Store Settings</TabButton>
        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={14}/>}>Users & Roles</TabButton>
        <TabButton active={activeTab === 'devices'} onClick={() => setActiveTab('devices')} icon={<Smartphone size={14}/>}>Devices</TabButton>
        <TabButton active={activeTab === 'subscription'} onClick={() => setActiveTab('subscription')} icon={<CreditCard size={14}/>}>Subscription</TabButton>
      </div>

      <div className="bg-white rounded-[24px] border-[0.5px] border-gray-200 shadow-sm overflow-hidden">


        {activeTab === 'store' && tenant && (
          <StoreSettingsTab 
            tenant={tenant} 
            profile={profile}
            branches={branches}
            onUpdate={fetchAllData} 
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'users' && <UsersTab users={users} branches={branches} profile={profile} onUpdate={fetchAllData} />}
        {activeTab === 'devices' && <DevicesTab />}
        {activeTab === 'subscription' && <SubscriptionTab subscription={subscription} tenant={tenant} onUpdate={fetchAllData} />}
      </div>
    </div>
  );
}

const TabButton = ({ active, children, onClick, icon }: { active: boolean, children: React.ReactNode, onClick: () => void, icon: React.ReactNode }) => (
  <button 
    onClick={onClick}
    className={`
      flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300
      ${active ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' : 'text-gray-400 hover:text-brand-dark hover:bg-gray-50'}
    `}
  >
    {icon}
    {children}
  </button>
);

const StoreSettingsTab = ({ tenant, profile, branches, onUpdate, setActiveTab }: { 
  tenant: ITenant,
  profile: { id: string; role: string; tenant_id: string; branch_id?: string } | null,
  branches: Array<{ id: string; name: string }>,
  onUpdate: () => void,
  setActiveTab: (tab: 'store' | 'users' | 'devices' | 'subscription') => void
}) => {
  const supabase = createClient();
  const [formData, setFormData] = useState<Partial<ITenant>>(tenant || {});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExportData = async () => {
    try {
      const { data: sales, error } = await supabase
        .from('sales')
        .select('*, branches!inner(tenant_id), user_profiles(full_name)')
        .eq('branches.tenant_id', tenant.id);
      
      if (error) throw error;
      
      const csvContent = [
        ['Date', 'Branch', 'Cashier', 'Receipt', 'Amount', 'Payment Method'].join(','),
        ...(sales || []).map(s => [
          new Date(s.created_at).toLocaleDateString(),
          (s as { branches?: { name: string } }).branches?.name || 'Main',
          s.user_profiles?.full_name,
          s.receipt_number,
          s.total_amount,
          s.payment_method
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `sales_export_${tenant.name.replace(/\s/g, '_')}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.showSuccess('Export completed');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Export failed';
      toast.showError(message);
    }
  };

  const handleResetData = async () => {
    const confirmName = prompt(`To reset all sales, inventory, and analytics, please type the store name: "${tenant.name}"`);
    if (confirmName !== tenant.name) {
      if (confirmName !== null) toast.showError('Store name mismatch. Reset cancelled.');
      return;
    }

    try {
      setDeleting(true);
      
      const { error } = await supabase.rpc('reset_tenant_data', { _tenant_id: tenant.id });
      if (error) throw error;

      toast.showSuccess('Store data reset successfully');
      onUpdate();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Reset failed';
      toast.showError(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmText = prompt('This will permanently delete your store and ALL accounts. Type "DELETE" to confirm:');
    if (confirmText !== 'DELETE') {
      if (confirmText !== null) toast.showError('Wrong confirmation. Deletion cancelled.');
      return;
    }

    try {
      setDeleting(true);
      const success = await safeQuery(
        () => supabase.from('tenants').delete().eq('id', tenant.id),
        'delete tenant'
      );
      
      if (success !== null) {
        toast.showSuccess('Account deleted. Logging out...');
        await supabase.auth.signOut();
        window.location.href = '/login';
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const success = await safeQuery(
        () => supabase
          .from('tenants')
          .update({
            name: formData.name,
            business_type: formData.business_type,
            county: formData.county,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            receipt_footer: formData.receipt_footer,
            vat_number: formData.vat_number
          })
          .eq('id', tenant.id),
        'update tenant'
      );

      if (success !== null) {
        toast.showSuccess('Store settings updated successfully');
        onUpdate();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="p-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-sm font-black text-brand-dark uppercase tracking-widest flex items-center gap-2">
            General Information
            <div className="h-[1px] flex-1 bg-gray-100" />
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Store Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <Input label="Store ID" value={`KITN-${tenant.id.slice(0, 4).toUpperCase()}`} disabled className="bg-gray-50 opacity-80 font-mono text-sm font-black text-brand-green" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Business Type</label>
              <select 
                className="w-full bg-white border border-gray-100 rounded-[12px] px-4 py-3 text-sm font-black text-brand-dark outline-none border focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all"
                value={formData.business_type}
                onChange={e => setFormData({...formData, business_type: e.target.value})}
              >
                {['supermarket','grocery','wholesale','retail','shop'].map(t => <option key={t} value={t} className="text-brand-dark font-bold">{t.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">County</label>
              <select 
                className="w-full bg-white border border-gray-100 rounded-[12px] px-4 py-3 text-sm font-black text-brand-dark outline-none border focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all"
                value={formData.county}
                onChange={e => setFormData({...formData, county: e.target.value})}
              >
                {COUNTIES.map(c => <option key={c} value={c} className="text-brand-dark font-bold">{c}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Subscription Tier</label>
            <div className="flex items-center justify-between p-3 bg-brand-green/5 border border-brand-green/10 rounded-xl">
              <div className="flex items-center gap-2">
                <Badge variant="success">{tenant.subscription_tier || 'FREE PLAN'}</Badge>
                <span className="text-[10px] font-bold text-gray-400 capitalize underline cursor-pointer" onClick={() => setActiveTab('subscription')}>View Billing</span>
              </div>
              <span className="text-[10px] font-bold text-gray-400 capitalize">14-day trial</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-black text-brand-dark uppercase tracking-widest flex items-center gap-2">
            Quick Links
            <div className="h-[1px] flex-1 bg-gray-100" />
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-4 p-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl group hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => window.location.href = '/dashboard/outlets'}>
              <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Layout size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-brand-dark">Manage Outlets</p>
                <p className="text-[10px] font-bold text-gray-500">Add branches, transfer stock, compare performance</p>
              </div>
              <ExternalLink size={14} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-purple-50/50 border border-purple-100/50 rounded-2xl group hover:bg-purple-50 transition-colors cursor-pointer" onClick={() => window.location.href = '/dashboard/team'}>
              <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Users size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-brand-dark">Manage Team</p>
                <p className="text-[10px] font-bold text-gray-500">View staff performance, shifts and activity</p>
              </div>
              <ExternalLink size={14} className="text-purple-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-black text-brand-dark uppercase tracking-widest flex items-center gap-2">
            Contact Details
            <div className="h-[1px] flex-1 bg-gray-100" />
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <Input label="Email Address" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <Input label="Physical Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-black text-brand-dark uppercase tracking-widest flex items-center gap-2">
            Regional & Tax
            <div className="h-[1px] flex-1 bg-gray-100" />
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Currency" value="KES" disabled className="bg-gray-50 opacity-100 font-black text-brand-green" />
            <Input label="VAT Number" value={formData.vat_number} onChange={e => setFormData({...formData, vat_number: e.target.value})} placeholder="P000..." />
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-black text-brand-dark uppercase tracking-widest flex items-center gap-2">
            Store Branding
            <div className="h-[1px] flex-1 bg-gray-100" />
          </h3>
          <div className="p-6 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-brand-green/30 transition-all group">
            {formData.logo_url ? (
              <Image src={formData.logo_url} width={80} height={80} className="object-contain" alt="Logo" />
            ) : (
              <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 group-hover:text-brand-green transition-all">
                <Plus size={32} />
              </div>
            )}
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Store Logo</p>
              <p className="text-[9px] text-gray-400 font-bold mt-1">PNG, JPG up to 2MB. Recommended: 512x512px.</p>
            </div>
            <input type="file" className="hidden" id="logo-upload" accept="image/*" disabled />
            <label htmlFor="logo-upload" className="px-4 py-2 bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-500 rounded-lg cursor-not-allowed hover:bg-gray-100 transition-all">
              Upload New Logo
            </label>
            {!formData.logo_url && <p className="text-[8px] text-amber-500 font-black uppercase tracking-widest leading-tight text-center max-w-[150px]">Create &apos;logos&apos; bucket in Supabase Storage to enable</p>}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-black text-brand-dark uppercase tracking-widest flex items-center gap-2">
            Access & Connected Outlet
            <div className="h-[1px] flex-1 bg-gray-100" />
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl space-y-3 border border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Branch</p>
                        <p className="text-sm font-black text-brand-dark">
                            {branches.find(b => b.id === profile?.branch_id)?.name || "Main Branch — Nairobi CBD"}
                        </p>
                    </div>
                    <Badge variant="info">Online</Badge>
                </div>
                <div className="h-[1px] bg-gray-200/50" />
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Admin Account</p>
                        <p className="text-[11px] font-bold text-gray-600">admin@kitnpos.co.ke</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Security PIN</p>
                        <div className="flex items-center gap-2">
                            <p className="text-[11px] font-black text-brand-green tracking-[0.2em]">••••</p>
                            <button type="button" className="text-[8px] font-black text-brand-green uppercase hover:underline">Show</button>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-black text-brand-dark uppercase tracking-widest flex items-center gap-2">
            Receipt Customization
            <div className="h-[1px] flex-1 bg-gray-100" />
          </h3>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Receipt Footer Message</label>
            <textarea 
              className="w-full bg-white border border-gray-100 rounded-[12px] px-4 py-3 text-sm font-medium outline-none border focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all min-h-[100px]"
              value={formData.receipt_footer}
              onChange={e => setFormData({...formData, receipt_footer: e.target.value})}
              placeholder="e.g. Thank you for shopping with us! Items sold are not returnable."
            />
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-gray-50 flex justify-end">
        <Button loading={saving} type="submit" className="gap-2">
          <Save size={18} /> Save All Changes
        </Button>
      </div>

      <div className="pt-12 space-y-6">
        <h3 className="text-sm font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
          Danger Zone
          <div className="h-[1px] flex-1 bg-red-100" />
        </h3>
        
        <div className="bg-red-50/30 border border-red-100 rounded-[32px] overflow-hidden">
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-black text-brand-dark">Export All Data</h4>
                <p className="text-xs text-gray-500 font-medium">Download your entire sales history and product catalog as CSV files.</p>
              </div>
              <Button variant="outline" onClick={handleExportData} className="border-gray-200 text-gray-600 gap-2 whitespace-nowrap">
                <Download size={16} /> Export Data (CSV)
              </Button>
            </div>
            
            <div className="h-[1px] bg-red-100/50" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-black text-brand-dark">Reset Store Data</h4>
                <p className="text-xs text-gray-500 font-medium">Clears all sales, inventory, and analytics while keeping your settings and team members.</p>
              </div>
              <Button variant="outline" onClick={handleResetData} loading={deleting} className="border-red-200 text-red-500 hover:bg-red-50 gap-2 whitespace-nowrap">
                <RefreshCw size={16} /> Reset All Data
              </Button>
            </div>
            
            <div className="h-[1px] bg-red-100/50" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-black text-red-600">Delete Account & Store</h4>
                <p className="text-xs text-red-400 font-medium">Permanently delete your store, all data, and accounts. This action cannot be undone.</p>
              </div>
              <Button onClick={handleDeleteAccount} loading={deleting} className="bg-red-600 hover:bg-red-700 text-white gap-2 whitespace-nowrap shadow-lg shadow-red-600/20">
                <Trash2 size={16} /> Delete Everything
              </Button>
            </div>
          </div>
          
          <div className="bg-red-50 p-4 px-8 border-t border-red-100 flex items-center gap-3">
            <ShieldAlert size={16} className="text-red-500" />
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Warning: These actions are irreversible</p>
          </div>
        </div>
      </div>
    </form>
  );
};

const UsersTab = ({ users, branches, profile, onUpdate }: { 
  users: IUserProfile[], 
  branches: Array<{ id: string, name: string }>, 
  profile: { id: string, tenant_id: string }, 
  onUpdate: () => void 
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<IUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [addFormData, setAddFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'cashier',
    branch_id: branches[0]?.id || '',
    pin: '',
    password: ''
  });

  const [editFormData, setEditFormData] = useState({
    full_name: '',
    role: 'cashier',
    branch_id: '',
    phone: ''
  });

  const [pinData, setPinData] = useState({ pin: '', confirmPin: '' });
  const [createdUserDetails, setCreatedUserDetails] = useState<ICreationDetails | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let pwd = "";
    for (let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    setAddFormData({...addFormData, password: pwd});
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate with Zod
    const validation = userSchema.safeParse(addFormData);

    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.issues.forEach(err => {
        if (err.path[0]) newErrors[err.path[0] as string] = err.message;
      });
      setErrors(newErrors);
      toast.showError('Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addFormData,
          tenant_id: profile.tenant_id
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setCreatedUserDetails({
        ...addFormData,
        url: window.location.origin
      });
      
      toast.showSuccess('User account created successfully');
      setIsAddModalOpen(false);
      setIsSuccessModalOpen(true);
      onUpdate();
      
      // Reset form
      setAddFormData({
        full_name: '',
        email: '',
        phone: '',
        role: 'cashier',
        branch_id: branches[0]?.id || '',
        pin: '',
        password: ''
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setErrors({});

    // Partial validation for editing
    const validation = userSchema.partial().safeParse(editFormData);

    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.issues.forEach(err => {
        if (err.path[0]) newErrors[err.path[0] as string] = err.message;
      });
      setErrors(newErrors);
      toast.showError('Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/users/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          ...editFormData
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast.showSuccess('Profile updated successfully');
      setIsEditModalOpen(false);
      onUpdate();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Update failed';
      toast.showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setErrors({});

    // Validate with Zod
    const validation = pinResetSchema.safeParse(pinData);

    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.issues.forEach(err => {
        if (err.path[0]) newErrors[err.path[0] as string] = err.message;
      });
      setErrors(newErrors);
      toast.showError('Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/users/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          pin_hash: pinData.pin // Using plaintext for MVP as per existing API
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast.showSuccess('PIN reset successfully');
      setIsPinModalOpen(false);
      setPinData({ pin: '', confirmPin: '' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'PIN reset failed';
      toast.showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: IUserProfile | null) => {
    if (!user || user.id === profile.id) return;
    try {
      setLoading(true);
      const response = await fetch('/api/users/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          is_active: !user.is_active
        })
      });

      if (!response.ok) throw new Error('Status update failed');
      toast.showSuccess(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
      setIsDeactivateModalOpen(false);
      onUpdate();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update status';
      toast.showError(message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.showSuccess(`${label} copied!`);
  };

  const openEditModal = (user: IUserProfile) => {
    setSelectedUser(user);
    setEditFormData({
      full_name: user.full_name,
      role: user.role,
      branch_id: user.branch_id || (branches.length > 0 ? branches[0].id : ''),
      phone: user.phone || ''
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="p-8 space-y-12">
      <div className="space-y-6">
        <div className="p-4 bg-brand-green/5 border border-brand-green/10 rounded-2xl flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
              <Users size={16} />
            </div>
            <div>
              <p className="text-[10px] font-black text-brand-green uppercase tracking-widest">Enhanced Management</p>
              <p className="text-xs font-bold text-gray-600">To view staff performance, shifts and activity logs, visit the Team page.</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = '/dashboard/team'}
            className="text-brand-green text-[10px] font-black uppercase tracking-widest gap-2 group-hover:bg-brand-green/5"
          >
            Team Page <ExternalLink size={12} />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-brand-dark uppercase tracking-widest">Team Members</h3>
            <p className="text-[11px] text-gray-400 font-bold uppercase mt-1">Manage access for your {users.length} staff members</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <UserPlus size={16} /> Add New User
          </Button>
        </div>

        <Table headers={['Name & Contact', 'Role', 'Branch', 'Status', 'Actions']}>
          {users.map((u) => (
            <tr key={u.id} className="group hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center font-black text-xs border border-brand-green/20">
                    {u.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-black text-brand-dark">{u.full_name}</p>
                    <p className="text-[10px] text-gray-400 font-bold lowercase tracking-tight">{u.email}</p>
                    {u.phone && <p className="text-[9px] text-gray-400 font-medium">{u.phone}</p>}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <Badge variant={(ROLES.find(r => r.value === u.role)?.variant as 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'purple') || 'gray'}>
                  {u.role}
                </Badge>
              </td>
              <td className="px-6 py-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                {u.branches?.name || 'All Branches'}
              </td>
              <td className="px-6 py-4">
                <Badge variant={u.is_active ? 'success' : 'gray'}>
                  {u.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openEditModal(u)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                    title="Edit User"
                  >
                    <Plus size={14} />
                  </button>
                  <button 
                    onClick={() => { setSelectedUser(u); setIsPinModalOpen(true); }}
                    className="p-2 text-gray-400 hover:text-brand-dark hover:bg-gray-100 rounded-lg transition-all"
                    title="Reset PIN"
                  >
                    <Smartphone size={14} />
                  </button>
                  <button 
                    disabled={u.id === profile.id}
                    onClick={() => { setSelectedUser(u); setIsDeactivateModalOpen(true); }}
                    className={`p-2 rounded-lg transition-all ${u.id === profile.id ? 'text-gray-200 cursor-not-allowed' : u.is_active ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                    title={u.id === profile.id ? "Cannot deactivate yourself" : u.is_active ? "Deactivate" : "Activate"}
                  >
                    <Power size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      {/* Permissions Summary Table */}
      <div className="space-y-6 pt-12 border-t border-gray-100">
        <div>
          <h3 className="text-sm font-black text-brand-dark uppercase tracking-widest">Role Permissions Reference</h3>
          <p className="text-[11px] text-gray-400 font-bold uppercase mt-1">Summary of system access by role</p>
        </div>
        <div className="bg-gray-50 rounded-3xl overflow-hidden border border-gray-100">
            <table className="w-full text-left text-xs">
                <thead className="bg-gray-100/50">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <th className="px-6 py-4">Feature</th>
                        <th className="px-6 py-4 text-center">Admin</th>
                        <th className="px-6 py-4 text-center">Manager</th>
                        <th className="px-6 py-4 text-center">Cashier</th>
                        <th className="px-6 py-4 text-center">Viewer</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {[
                        { f: 'Make Sales', a: true, m: true, c: true, v: false },
                        { f: 'View Reports', a: true, m: true, c: false, v: true },
                        { f: 'Manage Products', a: true, m: true, c: false, v: false },
                        { f: 'Manage Users', a: true, m: false, c: false, v: false },
                        { f: 'View Finance', a: true, m: true, c: false, v: false },
                        { f: 'Settings', a: true, m: false, c: false, v: false },
                    ].map((row, i) => (
                        <tr key={i} className="hover:bg-white transition-colors">
                            <td className="px-6 py-3 font-bold text-gray-600">{row.f}</td>
                            <td className="px-6 py-3 text-center">{row.a ? <span className="text-brand-green font-black">✓</span> : <span className="text-red-300">✗</span>}</td>
                            <td className="px-6 py-3 text-center">{row.m ? <span className="text-brand-green font-black">✓</span> : <span className="text-red-300">✗</span>}</td>
                            <td className="px-6 py-3 text-center">{row.c ? <span className="text-brand-green font-black">✓</span> : <span className="text-red-300">✗</span>}</td>
                            <td className="px-6 py-3 text-center">{row.v ? <span className="text-brand-green font-black">✓</span> : <span className="text-red-300">✗</span>}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New User" size="md">
        <form onSubmit={handleCreateUser} className="space-y-6">
          <div className="space-y-1">
            <Input label="Full Name*" required value={addFormData.full_name} onChange={e => setAddFormData({...addFormData, full_name: e.target.value})} />
            <FormError message={errors.full_name} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Input label="Email Address*" type="email" required value={addFormData.email} onChange={e => setAddFormData({...addFormData, email: e.target.value})} />
              <FormError message={errors.email} />
            </div>
            <div className="space-y-1">
              <Input label="Phone Number" value={addFormData.phone} onChange={e => setAddFormData({...addFormData, phone: e.target.value})} />
              <FormError message={errors.phone} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">System Role</label>
              <select 
                className="w-full bg-white border border-gray-100 rounded-[12px] px-4 py-3 text-sm font-bold text-brand-dark outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all"
                value={addFormData.role}
                onChange={e => setAddFormData({...addFormData, role: e.target.value})}
              >
                {ROLES.filter(r => r.value !== 'admin').map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <FormError message={errors.role} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Branch Access</label>
              <select 
                className="w-full bg-white border border-gray-100 rounded-[12px] px-4 py-3 text-sm font-bold text-brand-dark outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all"
                value={addFormData.branch_id}
                onChange={e => setAddFormData({...addFormData, branch_id: e.target.value})}
              >
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <FormError message={errors.branch_id} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Input label="Initial 4-Digit PIN*" type="password" maxLength={4} required value={addFormData.pin} onChange={e => setAddFormData({...addFormData, pin: e.target.value})} />
              <FormError message={errors.pin} />
            </div>
            <div className="relative space-y-1">
                <Input label="Temporary Password*" type="text" required value={addFormData.password} onChange={e => setAddFormData({...addFormData, password: e.target.value})} />
                <button type="button" onClick={generatePassword} className="absolute right-3 bottom-3 text-[9px] font-black text-brand-green uppercase hover:underline">Auto-Gen</button>
                <FormError message={errors.password} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Create Account</Button>
          </div>
        </form>
      </Modal>

      {/* Success Summary Modal */}
      <Modal isOpen={isSuccessModalOpen} onClose={() => setIsSuccessModalOpen(false)} title="User Created Successfully" size="sm">
        <div className="space-y-6">
            <p className="text-xs text-gray-500 font-medium">Share these login details with <span className="font-black text-brand-dark">{createdUserDetails?.full_name}</span>:</p>
            <div className="space-y-3">
                {[
                    { label: 'Email', value: createdUserDetails?.email },
                    { label: 'Password', value: createdUserDetails?.password },
                    { label: 'PIN', value: createdUserDetails?.pin },
                    { label: 'App URL', value: createdUserDetails?.url }
                ].map(item => (
                    <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                        <div className="min-w-0">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                            <p className="text-xs font-bold text-brand-dark truncate">{item.value}</p>
                        </div>
                        <button onClick={() => copyToClipboard(item.value || '', item.label)} className="p-2 text-brand-green opacity-0 group-hover:opacity-100 transition-opacity"><Plus size={14} /></button>
                    </div>
                ))}
            </div>
            <Button onClick={() => setIsSuccessModalOpen(false)} className="w-full">Done</Button>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit User Profile" size="md">
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="space-y-1">
            <Input label="Full Name*" required value={editFormData.full_name} onChange={e => setEditFormData({...editFormData, full_name: e.target.value})} />
            <FormError message={errors.full_name} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <Input label="Phone Number" value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} />
               <FormError message={errors.phone} />
             </div>
             <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">System Role</label>
              <select 
                className="w-full bg-white border border-gray-100 rounded-[12px] px-4 py-3 text-sm font-bold text-brand-dark outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all"
                value={editFormData.role}
                onChange={e => setEditFormData({...editFormData, role: e.target.value})}
              >
                {ROLES.filter(r => r.value !== 'admin').map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <FormError message={errors.role} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Branch Access</label>
            <select 
              className="w-full bg-white border border-gray-100 rounded-[12px] px-4 py-3 text-sm font-bold text-brand-dark outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all"
              value={editFormData.branch_id}
              onChange={e => setEditFormData({...editFormData, branch_id: e.target.value})}
            >
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <FormError message={errors.branch_id} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Reset PIN Modal */}
      <Modal isOpen={isPinModalOpen} onClose={() => setIsPinModalOpen(false)} title={`Reset PIN for ${selectedUser?.full_name}`} size="sm">
        <form onSubmit={handleResetPin} className="space-y-6">
            <div className="space-y-1">
                <Input label="New 4-Digit PIN*" type="password" maxLength={4} required value={pinData.pin} onChange={e => setPinData({...pinData, pin: e.target.value})} />
                <FormError message={errors.pin} />
            </div>
            <div className="space-y-1">
                <Input label="Confirm New PIN*" type="password" maxLength={4} required value={pinData.confirmPin} onChange={e => setPinData({...pinData, confirmPin: e.target.value})} />
                <FormError message={errors.confirmPin} />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                <Button type="button" variant="ghost" onClick={() => setIsPinModalOpen(false)}>Cancel</Button>
                <Button type="submit" loading={loading}>Update PIN</Button>
            </div>
        </form>
      </Modal>

      {/* Deactivate/Activate Confirmation Modal */}
      <Modal isOpen={isDeactivateModalOpen} onClose={() => setIsDeactivateModalOpen(false)} title={`${selectedUser?.is_active ? 'Deactivate' : 'Activate'} User`} size="sm">
        <div className="space-y-6">
            <div className="p-4 bg-red-50 rounded-2xl">
                <p className="text-xs text-red-600 font-bold leading-relaxed">
                    {selectedUser?.is_active 
                        ? `Are you sure you want to deactivate ${selectedUser?.full_name}? They will no longer be able to log in to the system.`
                        : `Are you sure you want to reactivate ${selectedUser?.full_name}? They will regain access to the system.`
                    }
                </p>
            </div>
            <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsDeactivateModalOpen(false)}>Cancel</Button>
                <Button 
                    onClick={() => handleToggleStatus(selectedUser)} 
                    loading={loading}
                    variant={selectedUser?.is_active ? 'danger' : 'primary'}
                >
                    Confirm {selectedUser?.is_active ? 'Deactivation' : 'Activation'}
                </Button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

const DevicesTab = () => {
  const [userAgent, setUserAgent] = useState('');
  
  useEffect(() => {
    setUserAgent(navigator.userAgent);
  }, []);

  const getDeviceIcon = (ua: string) => {
    if (ua.includes('Windows')) return 'Windows Desktop';
    if (ua.includes('iPhone') || ua.includes('Android')) return 'Mobile Device';
    return 'Web Browser';
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h3 className="text-sm font-black text-brand-dark uppercase tracking-widest">Authorized Devices</h3>
        <p className="text-[11px] text-gray-400 font-bold uppercase mt-1">Manage hardware that can access the POS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50/50 border border-green-100 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Smartphone size={100} />
          </div>
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="success">Active Device</Badge>
                <span className="text-[10px] font-black text-brand-green uppercase tracking-widest">This Device</span>
              </div>
              <div>
                <h4 className="text-lg font-black text-brand-dark tracking-tighter">{getDeviceIcon(userAgent)}</h4>
                <p className="text-xs text-gray-500 font-medium truncate max-w-[300px]">{userAgent}</p>
              </div>
              <div className="flex items-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <div className="flex items-center gap-1.5"><MapPin size={12} className="text-brand-green"/> Nairobi, KE</div>
                <div className="flex items-center gap-1.5"><Layout size={12} className="text-brand-green"/> Chrome 124.0</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50">Revoke Access</Button>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl opacity-60">
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="gray">Offline</Badge>
              </div>
              <div>
                <h4 className="text-lg font-black text-gray-400 tracking-tighter">Mobile POS Tablet (Kitchen)</h4>
                <p className="text-xs text-gray-400 font-medium">Last seen: 2 hours ago</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50">Revoke Access</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SubscriptionTab = ({ subscription, tenant, onUpdate }: { 
  subscription: ISubscription | null, 
  tenant: ITenant | null, 
  onUpdate: () => void 
}) => {
  interface IPlan {
    id: 'free' | 'basic' | 'pro';
    name: string;
    price: number;
    description: string;
    features: string[];
    missing: string[];
    highlight?: boolean;
  }

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<IPlan | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState(tenant?.phone || '');
  const [loading, setLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<ISubscription[]>([]);
  const supabase = createClient();

  const fetchPayments = useCallback(async () => {
    if (!tenant) return;
    const data = await safeQuery<ISubscription[]>(
      () => supabase
        .from('subscriptions')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('last_payment_date', { ascending: false }),
      'fetch payments'
    );
    
    if (data && data[0]?.last_payment_ref) {
      setPaymentHistory(data);
    }
  }, [tenant, supabase]);

  useEffect(() => {
    if (tenant) fetchPayments();
  }, [fetchPayments, tenant]);

  if (!tenant) return null;

  const handleUpgrade = async () => {
    if (!selectedPlan) return;
    try {
      setLoading(true);
      const res = await fetch('/api/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: mpesaPhone,
          amount: selectedPlan.price,
          reference: `SUBS-${tenant.id.slice(0, 4)}`,
          metadata: {
            plan: selectedPlan.id,
            tenant_id: tenant.id
          }
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      toast.showSuccess('STK Push sent! Please check your phone to complete payment.');
      setIsUpgradeModalOpen(false);
      
      // In a real app, we would poll for completion or use webhooks.
      // For this MVP, we just refresh after a delay or success.
      setTimeout(onUpdate, 10000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Upgrade failed';
      toast.showError(message);
    } finally {
      setLoading(false);
    }
  };

  const PLANS: IPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      description: 'Perfect for small shops starting out.',
      features: ['1 outlet', '2 staff members', '100 products max', 'Basic sales reports'],
      missing: ['Finance page', 'Multi-outlet', 'Data export']
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 999,
      description: 'Ideal for growing businesses with multiple staff.',
      features: ['3 outlets', '10 staff members', 'Unlimited products', 'Full reports + finance', 'Data export (CSV)'],
      missing: ['Unlimited outlets', 'API access'],
      highlight: true
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 2499,
      description: 'The complete solution for multi-branch empires.',
      features: ['Unlimited outlets', 'Unlimited staff', 'All features', 'Priority support', 'Custom receipt branding', 'API access'],
      missing: []
    }
  ];

  const currentPlan = PLANS.find(p => p.id === (subscription?.plan || 'free'));
  const daysRemaining = subscription?.trial_ends_at 
    ? Math.ceil((new Date(subscription.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="p-8 space-y-12 animate-in fade-in duration-500">
      {/* Current Plan Overview */}
      <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="success" className="px-4 py-1.5 text-[10px]">{currentPlan?.name.toUpperCase()} PLAN</Badge>
              <Badge variant={subscription?.status === 'trial' ? 'warning' : 'info'} className="px-4 py-1.5 text-[10px]">
                {subscription?.status?.toUpperCase() || 'STATUS'}
              </Badge>
            </div>
            <div>
              <h2 className="text-3xl font-black text-brand-dark tracking-tighter">
                {currentPlan?.name} Subscription
              </h2>
              <p className="text-sm text-gray-500 font-bold mt-1">
                {subscription?.status === 'trial' 
                  ? `Your trial period ends in ${daysRemaining} days.`
                  : `Next billing cycle on ${new Date(subscription?.current_period_end || '').toLocaleDateString()}.`}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button 
                onClick={() => { setSelectedPlan(PLANS[1]); setIsUpgradeModalOpen(true); }}
                className="gap-2 shadow-lg shadow-brand-green/20"
            >
              <CreditCard size={18} /> Upgrade Plan
            </Button>
            <Button variant="outline" className="gap-2 border-gray-200">
              <ExternalLink size={18} /> Billing Portal
            </Button>
          </div>
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h3 className="text-xl font-black text-brand-dark tracking-tighter uppercase">Choose Your Growth Plan</h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Scalable pricing for businesses of all sizes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div 
              key={plan.id}
              className={`
                relative p-8 rounded-[40px] border-2 transition-all duration-500
                ${plan.highlight ? 'border-brand-green bg-white shadow-2xl shadow-brand-green/10 scale-105 z-10' : 'border-gray-50 bg-gray-50/50 hover:bg-white hover:border-gray-200'}
              `}
            >
              {plan.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-green text-white px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-green/40">
                  Most Popular
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-black text-brand-dark uppercase tracking-wide">{plan.name}</h4>
                  <p className="text-xs text-gray-400 font-bold mt-1">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-brand-dark tracking-tighter">KES {plan.price.toLocaleString()}</span>
                  <span className="text-xs font-bold text-gray-400">/mo</span>
                </div>

                <Button 
                  className={`w-full py-4 rounded-[20px] font-black uppercase tracking-widest text-[10px] ${plan.id === subscription?.plan ? 'bg-gray-100 text-gray-400 cursor-default' : plan.highlight ? '' : 'variant-outline'}`}
                  disabled={plan.id === subscription?.plan}
                  onClick={() => { setSelectedPlan(plan); setIsUpgradeModalOpen(true); }}
                >
                  {plan.id === subscription?.plan ? 'Current Plan' : `Select ${plan.name}`}
                </Button>

                <div className="space-y-4 pt-6">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-3 text-[11px] font-bold text-gray-600">
                      <CheckCircle2 size={16} className="text-brand-green shrink-0" />
                      {f}
                    </div>
                  ))}
                  {plan.missing.map(f => (
                    <div key={f} className="flex items-center gap-3 text-[11px] font-bold text-gray-300">
                      <XCircle size={16} className="text-gray-200 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <div className="space-y-6 pt-12 border-t border-gray-100">
        <div>
          <h3 className="text-sm font-black text-brand-dark uppercase tracking-widest">Billing History</h3>
          <p className="text-[11px] text-gray-400 font-bold uppercase mt-1">Manage your previous invoices and payments</p>
        </div>
        
        <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden">
          <Table headers={['Date', 'Plan', 'Amount', 'Reference', 'Status']}>
            {paymentHistory.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-300">
                    <AlertCircle size={40} className="opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest">No payment records found</p>
                  </div>
                </td>
              </tr>
            ) : paymentHistory.map((p, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-4 text-xs font-bold text-brand-dark">
                  {p.last_payment_date ? new Date(p.last_payment_date).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-8 py-4">
                  <Badge variant="gray" className="uppercase text-[9px]">{p.plan}</Badge>
                </td>
                <td className="px-8 py-4 text-xs font-black text-brand-dark">
                  KES {p.last_payment_amount?.toLocaleString()}
                </td>
                <td className="px-8 py-4 text-xs font-bold text-gray-400 font-mono">
                  {p.last_payment_ref}
                </td>
                <td className="px-8 py-4">
                  <Badge variant="success">PAID</Badge>
                </td>
              </tr>
            ))}
          </Table>
        </div>
      </div>

      {/* Upgrade Modal */}
      <Modal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        title={`Upgrade to ${selectedPlan?.name}`}
        size="sm"
      >
        <div className="space-y-6">
          <div className="bg-brand-green/5 p-6 rounded-3xl border border-brand-green/10 space-y-4">
            <div className="flex items-center justify-between font-black text-brand-dark">
              <span>Selected Plan</span>
              <span className="uppercase text-brand-green">{selectedPlan?.name}</span>
            </div>
            <div className="flex items-center justify-between font-black text-brand-dark">
              <span>Amount Due</span>
              <span>KES {selectedPlan?.price.toLocaleString()}</span>
            </div>
            <div className="h-[1px] bg-brand-green/10" />
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
              * Payment will be processed via Safaricom M-Pesa STK Push. Ensure your phone is near and unlocked.
            </div>
          </div>

          <Input 
            label="M-Pesa Phone Number" 
            placeholder="07XXXXXXXX" 
            value={mpesaPhone}
            onChange={e => setMpesaPhone(e.target.value)}
          />

          <Button 
            onClick={handleUpgrade}
            loading={loading}
            className="w-full py-6 rounded-2xl shadow-xl shadow-brand-green/20 gap-3"
          >
            Pay KES {selectedPlan?.price.toLocaleString()} via M-Pesa
          </Button>

          <p className="text-[9px] text-center text-gray-400 font-bold uppercase tracking-tighter">
            Secure payment powered by KiTN POS & Daraja API
          </p>
        </div>
      </Modal>
    </div>
  );
};

