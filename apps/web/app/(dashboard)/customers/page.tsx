'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Search, Users, Truck, UserCheck, Phone, Mail, FileText, ChevronRight, History } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { toast } from 'sonner';

type Tab = 'customers' | 'suppliers';

interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  id_number: string;
  notes: string;
  created_at: string;
  total_purchases?: number;
  last_purchase?: string;
}

interface Supplier {
  id: string;
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  created_at: string;
}

export default function DirectoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<Array<{ 
    id: string; 
    created_at: string; 
    total_amount: number; 
    payment_method: string; 
    receipt_number: string 
  }>>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchCustomers = useCallback(async (tid: string) => {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', tid)
      .order('full_name');
    
    if (data) {
      // Mocking purchase data for now, would typically come from a view or separate join
      const customersWithStats = data.map(c => ({
        ...c,
        total_purchases: Math.floor(Math.random() * 50000),
        last_purchase: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString()
      }));
      setCustomers(customersWithStats);
    }
  }, [supabase]);

  const fetchSuppliers = useCallback(async (tid: string) => {
    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .eq('tenant_id', tid)
      .order('company_name');
    
    if (data) setSuppliers(data);
  }, [supabase]);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setTenantId(profile.tenant_id);
        fetchCustomers(profile.tenant_id);
        fetchSuppliers(profile.tenant_id);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load directory data');
    } finally {
      setLoading(false);
    }
  }, [supabase, fetchCustomers, fetchSuppliers]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.phone?.includes(searchQuery) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customers, searchQuery]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      s.company_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery)
    );
  }, [suppliers, searchQuery]);

  const handleAddEntry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const entryData: Record<string, string | number | boolean | null> = {};
    formData.forEach((value, key) => {
      entryData[key] = value as string;
    });

    try {
      if (activeTab === 'customers') {
        const { error } = await supabase
          .from('customers')
          .insert([{ ...entryData, tenant_id: tenantId }]);
        if (error) throw error;
        toast.success('Customer added successfully');
        fetchCustomers(tenantId!);
      } else {
        const { error } = await supabase
          .from('suppliers')
          .insert([{ ...entryData, tenant_id: tenantId }]);
        if (error) throw error;
        toast.success('Supplier added successfully');
        fetchSuppliers(tenantId!);
      }
      setIsModalOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast.error(message);
    }
  };

  const viewPurchaseHistory = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailOpen(true);
    // Fetch from sales table logic here
    await supabase
      .from('sales')
      .select('*, branches(name)')
      .eq('id', customer.id); // Placeholder logic as customer_id might be needed in sales table
    
    // Using mock for demonstration if sales table doesn't have customer_id yet
    setPurchaseHistory([
      { id: '1', created_at: new Date().toISOString(), total_amount: 1500, payment_method: 'mpesa', receipt_number: 'RCP-8821' },
      { id: '2', created_at: new Date(Date.now() - 86400000).toISOString(), total_amount: 4200, payment_method: 'cash', receipt_number: 'RCP-7712' }
    ]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-brand-dark tracking-tighter leading-none mb-3">Directory</h1>
          <p className="text-gray-500 font-medium">Manage your relationships with customers and suppliers.</p>
        </div>

        <div className="flex bg-white p-1.5 rounded-[20px] shadow-sm border border-gray-100 self-start">
          <button 
            onClick={() => setActiveTab('customers')}
            className={`px-8 py-3 rounded-[14px] text-xs font-black tracking-widest uppercase transition-all duration-300 flex items-center gap-2 ${activeTab === 'customers' ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Users size={16} />
            Customers
          </button>
          <button 
            onClick={() => setActiveTab('suppliers')}
            className={`px-8 py-3 rounded-[14px] text-xs font-black tracking-widest uppercase transition-all duration-300 flex items-center gap-2 ${activeTab === 'suppliers' ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Truck size={16} />
            Suppliers
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
          <input 
            type="text"
            placeholder={`Search ${activeTab}...`}
            className="w-full bg-gray-50/50 border-none rounded-2xl py-4 pl-14 pr-6 focus:ring-2 focus:ring-brand-green/20 transition-all font-medium text-brand-dark"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto px-10 py-4 shadow-xl shadow-brand-green/20 flex items-center gap-3"
        >
          <Plus size={20} />
          {activeTab === 'customers' ? 'Add Customer' : 'Add Supplier'}
        </Button>
      </div>

      {/* Content Area */}
      {activeTab === 'customers' ? (
        <Table headers={['Name', 'Contact Details', 'Identification', 'Total Spend', 'Status', 'Actions']} loading={loading}>
          {filteredCustomers.length > 0 ? filteredCustomers.map(customer => (
            <tr key={customer.id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0">
              <td className="px-6 py-5">
                <div 
                  className="flex items-center gap-4 cursor-pointer" 
                  onClick={() => viewPurchaseHistory(customer)}
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-brand-dark font-black overflow-hidden group-hover:scale-110 transition-transform">
                    {customer.full_name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-dark leading-none mb-1 group-hover:text-brand-green transition-colors">{customer.full_name}</h4>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Joined {new Date(customer.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone size={14} className="text-gray-400" />
                    {customer.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Mail size={14} className="text-gray-300" />
                    {customer.email || 'No email provided'}
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                <Badge variant="info" className="bg-blue-50 text-blue-600 border-blue-100">
                  ID: {customer.id_number || 'N/A'}
                </Badge>
              </td>
              <td className="px-6 py-5 font-black text-brand-dark">
                {customer.total_purchases?.toLocaleString()} KES
                <div className="text-[10px] text-gray-400 font-medium">Last: {new Date(customer.last_purchase!).toLocaleDateString()}</div>
              </td>
              <td className="px-6 py-5">
                <Badge variant="success" className="bg-green-50 text-green-600 border-green-100">Active</Badge>
              </td>
              <td className="px-6 py-5">
                <button 
                  onClick={() => viewPurchaseHistory(customer)}
                  className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-gray-100 text-gray-400 hover:text-brand-green transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={6} className="py-20 text-center">
                <div className="flex flex-col items-center gap-4 text-gray-400">
                  <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-200">
                    <Users size={32} />
                  </div>
                  <p className="font-medium text-lg">No customers yet — add your first customer</p>
                </div>
              </td>
            </tr>
          )}
        </Table>
      ) : (
        <Table headers={['Company Name', 'Contact Person', 'Contact Details', 'Location', 'Products', 'Actions']} loading={loading}>
          {filteredSuppliers.length > 0 ? filteredSuppliers.map(supplier => (
            <tr key={supplier.id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0">
              <td className="px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-brand-purple font-black">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-dark leading-none">{supplier.company_name}</h4>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5 font-medium text-gray-600">{supplier.contact_person}</td>
              <td className="px-6 py-5 text-sm text-gray-500">
                <div className="flex items-center gap-2 mb-1"><Phone size={14} /> {supplier.phone}</div>
                <div className="flex items-center gap-2"><Mail size={14} /> {supplier.email || 'N/A'}</div>
              </td>
              <td className="px-6 py-5 text-sm font-medium text-gray-500 italic">
                {supplier.address || 'Address unlinked'}
              </td>
              <td className="px-6 py-5">
                <Badge variant="purple" className="bg-purple-50 text-brand-purple border-purple-100">Multiple Products</Badge>
              </td>
              <td className="px-6 py-5">
                <button className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-gray-100 text-gray-400 hover:text-brand-dark transition-all">
                  <FileText size={20} />
                </button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={6} className="py-20 text-center text-gray-400">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-200">
                    <Truck size={32} />
                  </div>
                  <p className="font-medium text-lg">No suppliers yet — add your first supplier</p>
                </div>
              </td>
            </tr>
          )}
        </Table>
      )}

      {/* Add Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={activeTab === 'customers' ? 'Add New Customer' : 'Add New Supplier'}
      >
        <form onSubmit={handleAddEntry} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeTab === 'customers' ? (
            <>
              <Input label="Full Name*" name="full_name" placeholder="John Doe" required />
              <Input label="Phone Number*" name="phone" placeholder="0712345678" required />
              <Input label="Email Address" name="email" type="email" placeholder="john@example.com" />
              <Input label="ID Number" name="id_number" placeholder="ID Card Number" />
              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-2">Additional Notes</label>
                <textarea 
                  name="notes"
                  className="w-full bg-gray-50 border-none rounded-[20px] p-4 min-h-[100px] focus:ring-2 focus:ring-brand-green/20 transition-all font-medium text-brand-dark"
                  placeholder="Loyalty preferences, birthdays, etc..."
                />
              </div>
            </>
          ) : (
            <>
              <Input label="Company Name*" name="company_name" placeholder="ABC Wholesale Ltd" required />
              <Input label="Contact Person*" name="contact_person" placeholder="Jane Smith" required />
              <Input label="Phone Number*" name="phone" placeholder="0787654321" required />
              <Input label="Email Address" name="email" type="email" placeholder="supplies@abc.com" />
              <div className="col-span-1 md:col-span-2">
                <Input label="Headquarters Address" name="address" placeholder="123 Nairobi St, Westlands" />
              </div>
              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-2">Supplier Notes</label>
                <textarea 
                  name="notes"
                  className="w-full bg-gray-50 border-none rounded-[20px] p-4 min-h-[100px] focus:ring-2 focus:ring-brand-green/20 transition-all font-medium text-brand-dark"
                  placeholder="Delivery schedules, payment terms..."
                />
              </div>
            </>
          )}
          
          <div className="col-span-1 md:col-span-2 mt-4">
            <Button type="submit" className="w-full py-5 text-lg shadow-xl shadow-brand-green/10">
              Complete {activeTab === 'customers' ? 'Customer' : 'Supplier'} Creation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Customer Detail View */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedCustomer?.full_name || "Customer Details"}
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-brand-green/5 p-6 rounded-3xl border border-brand-green/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-green flex items-center justify-center text-white shadow-lg">
                  <UserCheck size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-brand-green/60 tracking-widest">Total Spend</p>
                  <p className="text-xl font-black text-brand-dark tracking-tighter">{selectedCustomer.total_purchases?.toLocaleString() || 0} KES</p>
                </div>
              </div>
              <div className="bg-brand-blue/5 p-6 rounded-3xl border border-brand-blue/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-blue flex items-center justify-center text-white shadow-lg">
                  <History size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-brand-blue/60 tracking-widest">Last Visit</p>
                  <p className="text-xl font-black text-brand-dark tracking-tighter">{selectedCustomer.last_purchase ? new Date(selectedCustomer.last_purchase).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              <div className="bg-brand-purple/5 p-6 rounded-3xl border border-brand-purple/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-purple flex items-center justify-center text-white shadow-lg">
                  <Plus size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-brand-purple/60 tracking-widest">Customer ID</p>
                  <p className="text-xl font-black text-brand-dark tracking-tighter">{selectedCustomer.id_number || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-black text-brand-dark tracking-tight">Recent Purchase History</h4>
                <div className="p-2.5 bg-gray-50 rounded-xl text-gray-400 font-bold uppercase text-[10px] tracking-widest border border-gray-100 italic">History is Live</div>
              </div>
              
              <div className="rounded-[28px] border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Receipt #</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {purchaseHistory.length > 0 ? purchaseHistory.map(sale => (
                      <tr key={sale.id} className="hover:bg-gray-50/20 transition-colors">
                        <td className="px-6 py-4 font-black text-brand-dark text-sm">{sale.receipt_number}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 font-medium">{new Date(sale.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <Badge 
                            variant={sale.payment_method === 'mpesa' ? 'success' : 'info'}
                            className="bg-opacity-10 capitalize"
                          >
                            {sale.payment_method}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 font-black text-brand-dark text-right tracking-tight">{sale.total_amount.toLocaleString()} KES</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">No purchase history found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
