'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  ShoppingBag, 
  Store, 
  Box, 
  PlusCircle, 
  CheckCircle2, 
  ChevronRight, 
  MapPin, 
  LayoutDashboard,
  Terminal,
  Trash2,
  Apple
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@supabase/supabase-js';

const KENYA_COUNTIES = [
  "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita-Taveta", "Garissa", "Wajir", "Mandera", "Marsabit",
  "Isiolo", "Meru", "Tharaka-Nithi", "Embu", "Kitui", "Machakos", "Makueni", "Nyandarua", "Nyeri", "Kirinyaga",
  "Murang'a", "Kiambu", "Turkana", "West Pokot", "Samburu", "Trans-Nzoia", "Uasin Gishu", "Elgeyo-Marakwet", "Nandi", "Baringo",
  "Laikipia", "Nakuru", "Narok", "Kajiado", "Kericho", "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia",
  "Siaya", "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi"
].sort();

const BIZ_TYPES = [
  { id: 'supermarket', name: 'Supermarket', icon: <ShoppingCart />, desc: 'Large multi-category store' },
  { id: 'grocery', name: 'Grocery Store', icon: <Apple />, desc: 'Fresh produce and food items' },
  { id: 'wholesale', name: 'Wholesale', icon: <Box />, desc: 'Bulk selling and distribution' },
  { id: 'retail', name: 'Retail Shop', icon: <ShoppingBag />, desc: 'General consumer goods' },
  { id: 'shop', name: 'General Shop', icon: <Store />, desc: 'Neighborhood convenience store' },
  { id: 'other', name: 'Other', icon: <PlusCircle />, desc: 'Custom business category' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  // State for all steps
  const [formData, setFormData] = useState({
    businessType: '',
    storeName: '',
    county: '',
    town: '',
    phone: '',
    outletName: '',
    outletAddress: '',
    openingHours: 'Mon-Sat 7AM-9PM',
    products: [
      { name: '', selling_price: '', quantity: '' },
      { name: '', selling_price: '', quantity: '' },
      { name: '', selling_price: '', quantity: '' },
    ]
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase.auth]);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Create Tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: formData.storeName,
          business_type: formData.businessType,
          county: formData.county,
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // 2. Create Branch (Outlet)
      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .insert({
          tenant_id: tenant.id,
          name: formData.outletName,
          location: formData.town + ', ' + formData.outletAddress,
          phone: formData.phone,
        })
        .select()
        .single();

      if (branchError) throw branchError;

      // 3. Update User Profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          tenant_id: tenant.id,
          branch_id: branch.id,
          role: 'admin'
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 4. Products & Inventory
      const validProducts = formData.products.filter(p => p.name && p.selling_price);
      if (validProducts.length > 0) {
        for (const p of validProducts) {
          const { data: product, error: pError } = await supabase
            .from('products')
            .insert({
              tenant_id: tenant.id,
              name: p.name,
              selling_price: parseFloat(p.selling_price),
              unit: 'pcs'
            })
            .select()
            .single();
          
          if (!pError && product && p.quantity) {
             await supabase.from('inventory').insert({
               product_id: product.id,
               branch_id: branch.id,
               quantity: parseFloat(p.quantity)
             });
          }
        }
      }

      // 5. Subscription (Free trial)
      await supabase.from('subscriptions').insert({
        tenant_id: tenant.id,
        plan: 'free',
        status: 'trial'
      });

      // 6. Finalize
      localStorage.setItem('kitn_onboarded', 'true');
      nextStep(); // Go to celebration step
      
      // Trigger confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1D9E75', '#378ADD', '#FFFFFF']
      });

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Setup failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white flex flex-col font-sans overflow-x-hidden">
      {/* Progress Bar */}
      {step <= 4 && (
        <div className="w-full h-1.5 bg-white/5 fixed top-0 left-0 z-50">
          <div 
            className="h-full bg-brand-green transition-all duration-500 ease-out shadow-[0_0_15px_rgba(29,158,117,0.5)]"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      )}

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-20 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <div className="inline-block px-4 py-1 rounded-full bg-brand-green/10 border border-brand-green/20 text-brand-green text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                  Step 1: Business Identity
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic text-white underline decoration-brand-green">Welcome to KiTN POS</h1>
                <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Select your industry to personalize your workspace</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {BIZ_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setFormData({ ...formData, businessType: type.id })}
                    className={`relative p-8 rounded-[32px] border-2 transition-all duration-300 text-left group overflow-hidden ${
                      formData.businessType === type.id 
                      ? 'bg-brand-green/10 border-brand-green' 
                      : 'bg-white/5 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${
                       formData.businessType === type.id ? 'bg-brand-green text-white shadow-lg' : 'bg-white/5 text-gray-400'
                    }`}>
                      {type.icon}
                    </div>
                    <div>
                      <h3 className="font-black uppercase tracking-tight text-sm mb-1">{type.name}</h3>
                      <p className="text-[10px] font-bold text-gray-500 leading-tight">{type.desc}</p>
                    </div>
                    {formData.businessType === type.id && (
                       <div className="absolute top-4 right-4 text-brand-green">
                          <CheckCircle2 size={24} />
                       </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex justify-center pt-8">
                <Button 
                  size="lg" 
                  disabled={!formData.businessType}
                  onClick={nextStep}
                  className="px-12 py-4 text-lg font-black uppercase tracking-widest shadow-2xl shadow-brand-green/20"
                >
                  Continue setup <ChevronRight className="ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
             <motion.div 
               key="step2"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="max-w-xl mx-auto w-full bg-white rounded-[40px] p-12 text-gray-900 shadow-[0_32px_100px_rgba(0,0,0,0.5)] border border-white/10"
             >
               <div className="mb-10 text-center space-y-2">
                 <h2 className="text-3xl font-black tracking-tight uppercase italic text-brand-dark">Store Details</h2>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base configuration for your business</p>
               </div>

               <div className="space-y-6">
                 <div className="grid grid-cols-1 gap-6">
                    <Input 
                      label="Store Name*" 
                      placeholder="e.g. Nairobi Supermarket"
                      value={formData.storeName}
                      onChange={(e) => setFormData({...formData, storeName: e.target.value})}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">County*</label>
                          <select 
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 font-bold text-sm focus:border-brand-green focus:outline-none focus:bg-white transition-all appearance-none"
                            value={formData.county}
                            onChange={(e) => setFormData({...formData, county: e.target.value})}
                          >
                             <option value="">Select County</option>
                             {KENYA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                       </div>
                       <Input 
                        label="Town/Location*" 
                        placeholder="e.g. CBD Area" 
                        value={formData.town}
                        onChange={(e) => setFormData({...formData, town: e.target.value})}
                      />
                    </div>

                    <Input 
                      label="Phone Number*" 
                      placeholder="07XX XXX XXX" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />

                    <Input 
                      label="Admin Email" 
                      value={user?.email || ''} 
                      disabled 
                      className="bg-gray-50 border-gray-100 italic"
                    />
                 </div>

                 <div className="flex gap-4 pt-6">
                    <Button variant="ghost" onClick={prevStep} className="flex-1 text-gray-400 font-black uppercase tracking-widest">Back</Button>
                    <Button 
                      disabled={!formData.storeName || !formData.county || !formData.town || !formData.phone}
                      onClick={nextStep} 
                      className="flex-1 py-5 text-[13px] font-black uppercase tracking-widest"
                    >
                      Continue
                    </Button>
                 </div>
               </div>
             </motion.div>
          )}

          {step === 3 && (
             <motion.div 
               key="step3"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="max-w-xl mx-auto w-full bg-white rounded-[40px] p-12 text-gray-900 shadow-[0_32px_100px_rgba(0,0,0,0.5)] border border-white/10"
             >
               <div className="mb-10 text-center space-y-2">
                 <h2 className="text-3xl font-black tracking-tight uppercase italic text-brand-dark">Main Outlet</h2>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Where is your primary shop located?</p>
               </div>

               <div className="space-y-6">
                  <Input 
                    label="Outlet Name*" 
                    placeholder="e.g. Westlands Branch" 
                    value={formData.outletName}
                    onChange={(e) => setFormData({...formData, outletName: e.target.value})}
                  />
                  <Input 
                    label="Physical Address*" 
                    placeholder="e.g. Mpesa Plaza, Ground Floor Room 4" 
                    value={formData.outletAddress}
                    onChange={(e) => setFormData({...formData, outletAddress: e.target.value})}
                  />
                  <Input 
                    label="Opening Hours" 
                    placeholder="e.g. Mon-Sat 7AM-9PM" 
                    value={formData.openingHours}
                    onChange={(e) => setFormData({...formData, openingHours: e.target.value})}
                  />

                  <div className="flex gap-4 pt-6">
                    <Button variant="ghost" onClick={prevStep} className="flex-1 text-gray-400 font-black uppercase tracking-widest">Back</Button>
                    <Button 
                      disabled={!formData.outletName || !formData.outletAddress}
                      onClick={nextStep} 
                      className="flex-1 py-5 text-[13px] font-black uppercase tracking-widest"
                    >
                      Continue Setup
                    </Button>
                 </div>
               </div>
             </motion.div>
          )}

          {step === 4 && (
             <motion.div 
               key="step4"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="max-w-2xl mx-auto w-full bg-white rounded-[40px] p-12 text-gray-900 shadow-[0_32px_100px_rgba(0,0,0,0.5)] border border-white/10"
             >
               <div className="mb-10 text-center space-y-2">
                 <h2 className="text-3xl font-black tracking-tight uppercase italic text-brand-dark">Initial Products</h2>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Add a few items to start your inventory</p>
               </div>

               <div className="space-y-4">
                  <div className="grid grid-cols-[1fr,120px,100px,40px] gap-3 mb-2 px-4">
                     <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Product Name</span>
                     <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Price (KES)</span>
                     <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Qty</span>
                     <span />
                  </div>
                  
                  {formData.products.map((prod, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr,120px,100px,40px] gap-3 group">
                       <input 
                         className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-brand-green focus:outline-none placeholder:text-gray-300"
                         placeholder="Item name..."
                         value={prod.name}
                         onChange={(e) => {
                           const newProducts = [...formData.products];
                           newProducts[idx].name = e.target.value;
                           setFormData({...formData, products: newProducts});
                         }}
                       />
                       <input 
                         className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-brand-green focus:outline-none text-right"
                         placeholder="0.00"
                         value={prod.selling_price}
                         onChange={(e) => {
                           const newProducts = [...formData.products];
                           newProducts[idx].selling_price = e.target.value;
                           setFormData({...formData, products: newProducts});
                         }}
                       />
                       <input 
                         className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-brand-green focus:outline-none text-center"
                         placeholder="0"
                         value={prod.quantity}
                         onChange={(e) => {
                           const newProducts = [...formData.products];
                           newProducts[idx].quantity = e.target.value;
                           setFormData({...formData, products: newProducts});
                         }}
                       />
                       <button 
                        disabled={formData.products.length === 1}
                        onClick={() => {
                          const newProducts = formData.products.filter((_, i) => i !== idx);
                          setFormData({...formData, products: newProducts});
                        }}
                        className="text-gray-300 hover:text-red-500 transition-colors flex items-center justify-center"
                       >
                         <Trash2 size={18} />
                       </button>
                    </div>
                  ))}

                  <button 
                    onClick={() => setFormData({...formData, products: [...formData.products, { name: '', selling_price: '', quantity: '' }]})}
                    className="flex items-center gap-2 text-[10px] font-black text-brand-green uppercase tracking-widest pl-2 hover:underline pt-2"
                  >
                    <PlusCircle size={14} /> Add Another Product
                  </button>

                  <div className="pt-8 flex flex-col gap-4">
                     <div className="flex gap-4">
                        <Button variant="ghost" onClick={prevStep} className="flex-1 text-gray-400 font-black uppercase tracking-widest">Back</Button>
                        <Button 
                          onClick={handleFinish} 
                          loading={loading}
                          className="flex-[2] py-5 text-[14px] font-black uppercase tracking-widest shadow-xl shadow-brand-green/20"
                        >
                          Finish Setup <ChevronRight className="ml-2" />
                        </Button>
                     </div>
                     <button onClick={handleFinish} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-brand-dark transition-colors">Skip for now</button>
                  </div>
               </div>
             </motion.div>
          )}

          {step === 5 && (
            <motion.div 
               key="step5"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="text-center space-y-12"
            >
               <div className="space-y-6">
                 <div className="flex flex-col items-center gap-2 mb-8">
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">KiTN</h1>
                    <div className="h-1 w-12 bg-brand-green rounded-full shadow-[0_0_10px_#1D9E75]" />
                 </div>
                 
                 <div className="w-32 h-32 bg-brand-green/10 rounded-full mx-auto flex items-center justify-center text-brand-green border-4 border-brand-green shadow-[0_0_50px_rgba(29,158,117,0.3)]">
                    <CheckCircle2 size={64} className="animate-[bounce_2s_infinite]" />
                 </div>
                 
                 <div className="space-y-2">
                    <h2 className="text-4xl font-black tracking-tight uppercase">You are all set, {formData.storeName}!</h2>
                    <p className="text-gray-400 font-bold uppercase text-xs tracking-[0.2em]">Your business operating system is ready</p>
                 </div>
               </div>

               <div className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 backdrop-blur-xl">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-left">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Active Plan</p>
                        <p className="text-xs font-black text-brand-green uppercase tracking-widest">Free Trial (14d)</p>
                     </div>
                     <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-left">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Products</p>
                        <p className="text-xs font-black text-white uppercase tracking-widest">{formData.products.filter(p => p.name).length} added</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/5 text-left">
                     <MapPin size={16} className="text-[#378ADD]" />
                     <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Initial Outlet</p>
                        <p className="text-xs font-bold text-white uppercase tracking-widest">{formData.outletName}</p>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                  <Button 
                    size="lg" 
                    onClick={() => window.location.href = '/dashboard/pos'}
                    className="px-10 py-5 font-black uppercase tracking-[0.2em] gap-3 bg-brand-green hover:bg-brand-green/80 ring-offset-2 ring-offset-[#1A1A2E]"
                  >
                    <Terminal size={20} /> Open POS Terminal
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={() => window.location.href = '/dashboard'}
                    className="px-10 py-5 border-white/20 text-white font-black uppercase tracking-[0.2em] gap-3 hover:bg-white/5"
                  >
                    <LayoutDashboard size={20} /> Go to Dashboard
                  </Button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
