import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy, 
  Globe, 
  Shield, 
  Search,
  FileText,
  Lock,
  Inbox,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Building,
  Pencil,
  Link as LinkIcon,
  ExternalLink,
  Loader2,
  Terminal,
  AlertCircle,
  Check,
  Filter,
  X,
  AlertTriangle
} from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { StoredCredential, FormSubmission, RoutePath } from '../types';
import { supabase } from '../services/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Form Types Definition
const FORM_TYPES = [
  'SMS Onboarding form',
  'Jack Ryan A.I. 1st Call',
  'Call List Submission Form',
  'Jack Ryan A.I. Client Onboarding Form'
];

// Mapping Forms to Specific Tables
const TABLE_MAP: Record<string, string> = {
  'SMS Onboarding form': 'sms_onboarding_submissions',
  'Jack Ryan A.I. 1st Call': 'first_call_submissions',
  'Call List Submission Form': 'call_list_submissions',
  'Jack Ryan A.I. Client Onboarding Form': 'client_onboarding_submissions'
};

// Default Palette for CRMs without specific branding
const CRM_COLORS = [
  { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', hover: 'hover:bg-blue-100' },
  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', hover: 'hover:bg-emerald-100' },
  { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', hover: 'hover:bg-purple-100' },
  { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', hover: 'hover:bg-amber-100' },
  { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', hover: 'hover:bg-rose-100' },
  { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', hover: 'hover:bg-indigo-100' },
  { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', hover: 'hover:bg-cyan-100' },
  { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200', hover: 'hover:bg-fuchsia-100' },
];

// Custom Brand Overrides
const CRM_BRAND_DEFAULTS: Record<string, typeof CRM_COLORS[0]> = {
  'boomtown': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', hover: 'hover:bg-orange-100' },
  'boom town': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', hover: 'hover:bg-orange-100' },
  'cinc': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', hover: 'hover:bg-cyan-100' },
  'follow up boss': { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200', hover: 'hover:bg-sky-100' },
  'fub': { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200', hover: 'hover:bg-sky-100' },
  'hubspot': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', hover: 'hover:bg-orange-100' },
  'salesforce': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', hover: 'hover:bg-blue-100' },
  'kvcore': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', hover: 'hover:bg-emerald-100' },
  'chime': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', hover: 'hover:bg-violet-100' },
  'lofty': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', hover: 'hover:bg-violet-100' },
  'redfin': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', hover: 'hover:bg-red-100' },
  'zillow': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', hover: 'hover:bg-blue-100' },
};

const COMMON_CRMS = [
  'HubSpot', 'Salesforce', 'Zoho CRM', 'Pipedrive', 'Monday.com', 
  'CINC', 'BoomTown', 'KVCore', 'Follow Up Boss', 'LionDesk', 
  'RealtyJuggler', 'Top Producer', 'Wise Agent', 'Chime', 'Brivity', 
  'Market Leader', 'Lofty', 'Sierra Interactive', 'Redfin', 'Zillow Premier Agent'
];

// Mock Data for Fallback (if DB connection fails)
const FALLBACK_SUBMISSIONS: FormSubmission[] = [
  { 
    id: 'sub_demo_1', 
    source: 'SMS Onboarding form', 
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), 
    status: 'processed', 
    ipAddress: '192.168.1.45', 
    payload: { 
      "business_name": "Apex Realty Group", 
      "industry": "Real Estate", 
      "full_name": "John Doe",
      "primary_bot_goal": "Book seller appointments",
      "note": "Demo Data - Database Table Missing"
    } 
  }
];

const SETUP_SQL = `-- Run this in your Supabase SQL Editor to create the required tables

-- 1. SMS Onboarding Table
create table if not exists public.sms_onboarding_submissions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'pending',
  ip_address text,
  payload jsonb default '{}'::jsonb,
  source text default 'SMS Onboarding form'
);
alter table public.sms_onboarding_submissions enable row level security;
create policy "Allow all access for authenticated users" on public.sms_onboarding_submissions for all to authenticated using (true);
create policy "Allow public inserts" on public.sms_onboarding_submissions for insert to anon with check (true);

-- 2. First Call Table
create table if not exists public.first_call_submissions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'pending',
  ip_address text,
  payload jsonb default '{}'::jsonb,
  source text default 'Jack Ryan A.I. 1st Call'
);
alter table public.first_call_submissions enable row level security;
create policy "Allow all access for authenticated users" on public.first_call_submissions for all to authenticated using (true);
create policy "Allow public inserts" on public.first_call_submissions for insert to anon with check (true);

-- 3. Call List Table
create table if not exists public.call_list_submissions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'pending',
  ip_address text,
  payload jsonb default '{}'::jsonb,
  source text default 'Call List Submission Form'
);
alter table public.call_list_submissions enable row level security;
create policy "Allow all access for authenticated users" on public.call_list_submissions for all to authenticated using (true);
create policy "Allow public inserts" on public.call_list_submissions for insert to anon with check (true);

-- 4. Client Onboarding Table
create table if not exists public.client_onboarding_submissions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'pending',
  ip_address text,
  payload jsonb default '{}'::jsonb,
  source text default 'Jack Ryan A.I. Client Onboarding Form'
);
alter table public.client_onboarding_submissions enable row level security;
create policy "Allow all access for authenticated users" on public.client_onboarding_submissions for all to authenticated using (true);
create policy "Allow public inserts" on public.client_onboarding_submissions for insert to anon with check (true);

-- 5. Credentials Table
create table if not exists public.credentials (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  client_name text,
  service_name text,
  crm_link text,
  username text,
  password text,
  last_updated timestamp with time zone default timezone('utc'::text, now())
);
alter table public.credentials enable row level security;
create policy "Allow all access for authenticated users" on public.credentials for all to authenticated using (true);
create policy "Allow public inserts" on public.credentials for insert to anon with check (true);
`;

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  // Navigation State
  const [activeMainTab, setActiveMainTab] = useState<'credentials' | 'submissions'>('credentials');
  const [activeFormTab, setActiveFormTab] = useState<string>(FORM_TYPES[0]);

  // Data State
  const [credentials, setCredentials] = useState<StoredCredential[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [formCounts, setFormCounts] = useState<Record<string, number>>({}); 
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [demoMode, setDemoMode] = useState(false);
  
  // Delete Modal State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  // Loading State
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(true);
  const [isSavingCredential, setIsSavingCredential] = useState(false);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  
  // Modal State
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  
  // Search & Pagination & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrmFilter, setSelectedCrmFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);

  // Status Dropdown State
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);

  // CRM Dropdown State
  const [isCrmDropdownOpen, setIsCrmDropdownOpen] = useState(false);
  const crmFilterRef = useRef<HTMLDivElement>(null);

  // Editing Submission State
  const [editingSubmission, setEditingSubmission] = useState<FormSubmission | null>(null);
  const [isEditSubmissionModalOpen, setIsEditSubmissionModalOpen] = useState(false);
  
  // Form State for Credentials
  const [newCred, setNewCred] = useState<Omit<StoredCredential, 'id' | 'lastUpdated'>>({ 
    clientName: '',
    serviceName: '', 
    crmLink: '',
    username: '', 
    password: '' 
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCrmSuggestions, setShowCrmSuggestions] = useState(false);
  const crmInputWrapperRef = useRef<HTMLDivElement>(null);

  // Refs for Realtime
  const activeFormTabRef = useRef(activeFormTab);

  // Constants
  const ITEMS_PER_PAGE_CREDENTIALS = 9;
  const ITEMS_PER_PAGE_SUBMISSIONS = 10;

  useEffect(() => {
    activeFormTabRef.current = activeFormTab;
  }, [activeFormTab]);

  // Click outside listener for status dropdown, CRM suggestions, and CRM Filter
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      setOpenStatusId(null);
      
      if (crmInputWrapperRef.current && !crmInputWrapperRef.current.contains(event.target as Node)) {
        setShowCrmSuggestions(false);
      }
      
      if (crmFilterRef.current && !crmFilterRef.current.contains(event.target as Node)) {
        setIsCrmDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // --- HELPER FUNCTIONS ---
  const formatLabel = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const getCrmStyle = (crmName: string) => {
    if (!crmName) return CRM_COLORS[0];
    
    // Check for specific brands first
    const lowerName = crmName.toLowerCase();
    const brandMatch = Object.keys(CRM_BRAND_DEFAULTS).find(brand => lowerName.includes(brand));
    
    if (brandMatch) {
        return CRM_BRAND_DEFAULTS[brandMatch];
    }

    // Default hash function for others
    let hash = 0;
    for (let i = 0; i < crmName.length; i++) {
      hash = crmName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % CRM_COLORS.length;
    return CRM_COLORS[index];
  };

  // Get unique CRMs from credentials, case-insensitive logic for uniqueness
  const uniqueCrms = useMemo(() => {
    const map = new Map<string, string>();
    credentials.forEach(c => {
        if(c.serviceName) {
            const lowerKey = c.serviceName.toLowerCase();
            // Store if not exists. 
            // Optional improvement: prefer the casing that has more capitals (e.g. CINC over Cinc)
            if(!map.has(lowerKey)) {
                map.set(lowerKey, c.serviceName);
            } else {
                // If the current one is all uppercase, replace the stored one
                const currentStored = map.get(lowerKey);
                if (c.serviceName === c.serviceName.toUpperCase() && currentStored !== c.serviceName) {
                    map.set(lowerKey, c.serviceName);
                }
            }
        }
    });
    return Array.from(map.values()).sort();
  }, [credentials]);

  // --- SUPABASE DATA FETCHING ---
  const fetchSingleCount = async (formType: string, tableName: string) => {
    try {
      const { count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      setFormCounts(prev => ({ ...prev, [formType]: count || 0 }));
    } catch (err) {
      console.warn(`Failed to fetch count for ${formType}`, err);
    }
  };

  const updateAllCounts = async () => {
    const promises = Object.entries(TABLE_MAP).map(async ([type, tableName]) => {
      const { count, error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
      if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
        return { type, count: 0, missing: true };
      }
      return { type, count: count || 0, missing: false };
    });

    const results = await Promise.all(promises);
    const newCounts: Record<string, number> = {};
    let missingTableDetected = false;

    results.forEach(r => {
      newCounts[r.type] = r.count;
      if (r.missing) missingTableDetected = true;
    });

    setFormCounts(newCounts);
    if (missingTableDetected) setDemoMode(true);
  };

  const fetchCredentials = async () => {
    try {
      setIsLoadingCredentials(true);
      const { data, error } = await supabase
        .from('credentials')
        .select('*')
        .order('last_updated', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedCredentials: StoredCredential[] = data.map((item: any) => ({
          id: item.id,
          clientName: item.client_name,
          serviceName: item.service_name,
          crmLink: item.crm_link || '',
          username: item.username || '',
          password: item.password || '',
          lastUpdated: new Date(item.last_updated)
        }));
        setCredentials(mappedCredentials);
      }
    } catch (error: any) {
      if (!error.message?.includes('Could not find the table') && error.code !== '42P01') {
        console.warn('Error fetching credentials:', error.message || error);
      }
    } finally {
      setIsLoadingCredentials(false);
    }
  };

  const fetchSubmissionsData = async (targetTab: string) => {
    try {
      setIsLoadingSubmissions(true);
      const tableName = TABLE_MAP[targetTab];
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedSubmissions: FormSubmission[] = data.map((item: any) => ({
          id: item.id,
          source: item.source || targetTab,
          status: item.status,
          payload: item.payload || {},
          ipAddress: item.ip_address || 'Unknown',
          timestamp: item.created_at
        }));
        setSubmissions(mappedSubmissions);
        setDemoMode(false);
      }
    } catch (error: any) {
      if (error.message?.includes('Could not find the table') || error.code === '42P01') {
        console.warn(`Table ${TABLE_MAP[targetTab]} missing. Enabling Demo Mode.`);
        setSubmissions(FALLBACK_SUBMISSIONS.filter(s => s.source === targetTab));
        setDemoMode(true);
      } else {
        console.error('Error fetching submissions:', error.message || error);
        setSubmissions([]);
      }
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
    updateAllCounts();
  }, []);

  useEffect(() => {
    if (activeMainTab === 'submissions') {
      fetchSubmissionsData(activeFormTab);
    }
  }, [activeFormTab, activeMainTab]);

  useEffect(() => {
    const channels: RealtimeChannel[] = [];
    
    const credChannel = supabase
      .channel('public:credentials')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credentials' }, () => fetchCredentials())
      .subscribe();
    channels.push(credChannel);

    Object.entries(TABLE_MAP).forEach(([formType, tableName]) => {
      const formChannel = supabase
        .channel(`public:${tableName}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, () => {
          fetchSingleCount(formType, tableName);
          if (activeFormTabRef.current === formType) {
             fetchSubmissionsData(formType);
          }
        })
        .subscribe();
      channels.push(formChannel);
    });

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, []);

  // --- HANDLERS ---
  const handleSaveCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCredential(true);
    try {
      if (editingId) {
        await supabase.from('credentials').update({
            client_name: newCred.clientName,
            service_name: newCred.serviceName,
            crm_link: newCred.crmLink,
            username: newCred.username,
            password: newCred.password,
            last_updated: new Date().toISOString()
          }).eq('id', editingId);
      } else {
        await supabase.from('credentials').insert({
            client_name: newCred.clientName,
            service_name: newCred.serviceName,
            crm_link: newCred.crmLink,
            username: newCred.username,
            password: newCred.password,
            last_updated: new Date().toISOString()
          });
      }
      await fetchCredentials(); 
      setIsAddModalOpen(false);
      setNewCred({ clientName: '', serviceName: '', crmLink: '', username: '', password: '' });
      setEditingId(null);
      setShowCrmSuggestions(false);
    } catch (error: any) {
       if (error.code === '42P01') {
        alert("Setup Required: The 'credentials' table is missing.");
        setIsSqlModalOpen(true);
      } else {
        alert(`Failed to save credential: ${error.message}`);
      }
    } finally {
      setIsSavingCredential(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setNewCred({ clientName: '', serviceName: '', crmLink: '', username: '', password: '' });
    setShowCrmSuggestions(false);
    setIsAddModalOpen(true);
  };

  const openEditModal = (cred: StoredCredential) => {
    setEditingId(cred.id);
    setNewCred({ clientName: cred.clientName, serviceName: cred.serviceName, crmLink: cred.crmLink, username: cred.username, password: cred.password });
    setShowCrmSuggestions(false);
    setIsAddModalOpen(true);
  };

  const openDeleteModal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmation({ isOpen: true, id });
  };

  const confirmDeleteCredential = async () => {
    const id = deleteConfirmation.id;
    if (!id) return;

    // Optimistic Update
    setCredentials(prev => prev.filter(c => c.id !== id));
    setDeleteConfirmation({ isOpen: false, id: null });

    const { error } = await supabase.from('credentials').delete().eq('id', id);
    if(error) {
        console.error("Delete failed", error);
        // If deletion fails, revert by refetching
        fetchCredentials();
        alert("Failed to delete credential. Please try again.");
    }
  };

  const togglePassword = (id: string) => setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  
  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  const toggleSubmission = (id: string) => {
    setExpandedSubmissionId(prevId => prevId === id ? null : id);
  };

  const handleStatusChange = async (id: string, newStatus: 'pending' | 'processed' | 'flagged', e: React.MouseEvent) => {
      e.stopPropagation();
      setOpenStatusId(null);
      
      // Optimistic update
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));

      const tableName = TABLE_MAP[activeFormTab];
      await supabase.from(tableName).update({ status: newStatus }).eq('id', id);
  };

  const toggleStatusDropdown = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setOpenStatusId(openStatusId === id ? null : id);
  };

  const handleEditSubmissionClick = (submission: FormSubmission, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSubmission(JSON.parse(JSON.stringify(submission)));
    setIsEditSubmissionModalOpen(true);
  };

  const handleSaveSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubmission) {
      const tableName = TABLE_MAP[activeFormTab];
      await supabase.from(tableName).update({ payload: editingSubmission.payload }).eq('id', editingSubmission.id);
      setIsEditSubmissionModalOpen(false);
      setEditingSubmission(null);
    }
  };

  const handlePayloadChange = (key: string, value: string) => {
    if (editingSubmission) {
      setEditingSubmission({ ...editingSubmission, payload: { ...editingSubmission.payload, [key]: value } });
    }
  };

  // --- FILTERING & PAGINATION ---
  const filteredCredentials = credentials.filter(cred => {
    // Case-insensitive comparison
    const matchesCrm = selectedCrmFilter 
        ? cred.serviceName.toLowerCase() === selectedCrmFilter.toLowerCase() 
        : true;

    if (!searchQuery && !selectedCrmFilter) return true;
    if (!matchesCrm) return false;
    
    const q = searchQuery.toLowerCase();
    return cred.clientName.toLowerCase().includes(q) || cred.serviceName.toLowerCase().includes(q);
  });

  const filteredSubmissions = submissions.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const payloadValues = s.payload ? Object.values(s.payload) : [];
    return (
        s.id.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q) ||
        s.ipAddress.includes(q) ||
        payloadValues.some(val => String(val).toLowerCase().includes(q))
    );
  });

  const totalSubmissionsCount = (Object.values(formCounts) as number[]).reduce((a, b) => a + b, 0);

  const itemsPerPage = activeMainTab === 'credentials' ? ITEMS_PER_PAGE_CREDENTIALS : ITEMS_PER_PAGE_SUBMISSIONS;
  const totalItems = activeMainTab === 'credentials' ? filteredCredentials.length : filteredSubmissions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startStartIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startStartIndex + itemsPerPage;
  const currentCredentials = filteredCredentials.slice(startStartIndex, endIndex);
  const currentSubmissions = filteredSubmissions.slice(startStartIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const PaginationControls = () => {
    if (totalItems === 0 && searchQuery) return null;
    return (
      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 bg-white rounded-b-xl mt-auto">
        <div className="flex flex-1 justify-between sm:hidden">
          <Button variant="secondary" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="text-xs px-3 py-1.5 h-auto">Previous</Button>
          <Button variant="secondary" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="text-xs px-3 py-1.5 h-auto">Next</Button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">Showing <span className="font-medium">{Math.min(startStartIndex + 1, totalItems)}</span> to <span className="font-medium">{Math.min(endIndex, totalItems)}</span> of <span className="font-medium">{totalItems}</span> results</p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="h-5 w-5" /></button>
              <div className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300">Page {currentPage} of {totalPages}</div>
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="h-5 w-5" /></button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  const StatusDropdown = ({ status, id }: { status: string, id: string }) => {
    const isOpen = openStatusId === id;
    
    let buttonClass = "";
    if (status === 'processed') buttonClass = "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100";
    else if (status === 'flagged') buttonClass = "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100";
    else buttonClass = "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100";

    return (
        <div className="relative">
            <button 
                onClick={(e) => toggleStatusDropdown(id, e)}
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border mb-1 transition-colors ${buttonClass} outline-none focus:outline-none`}
            >
                {status}
                <ChevronDown className="h-3 w-3 ml-1" />
            </button>
            
            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-20 animate-fade-in">
                    <button 
                        onClick={(e) => handleStatusChange(id, 'pending', e)}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 flex items-center justify-between outline-none focus:outline-none"
                    >
                        Pending {status === 'pending' && <Check className="h-3 w-3" />}
                    </button>
                    <button 
                        onClick={(e) => handleStatusChange(id, 'processed', e)}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 flex items-center justify-between outline-none focus:outline-none"
                    >
                        Processed {status === 'processed' && <Check className="h-3 w-3" />}
                    </button>
                    <button 
                        onClick={(e) => handleStatusChange(id, 'flagged', e)}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 flex items-center justify-between outline-none focus:outline-none"
                    >
                        Flagged {status === 'flagged' && <Check className="h-3 w-3" />}
                    </button>
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mission Control</h1>
          <p className="mt-1 text-gray-500">Secure access management and data intelligence.</p>
        </div>
        
        {/* Actions - Added z-index to ensure dropdowns overlap content below */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center relative z-50">
            {/* Custom CRM Filter Dropdown */}
            {activeMainTab === 'credentials' && (
                <div className="relative min-w-[180px] hidden md:block animate-fade-in" ref={crmFilterRef}>
                    <button
                        onClick={() => setIsCrmDropdownOpen(!isCrmDropdownOpen)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 bg-white border rounded-xl text-sm font-medium transition-all shadow-sm ${selectedCrmFilter ? 'border-indigo-300 ring-2 ring-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-700 hover:border-indigo-300'}`}
                    >
                        <span className="truncate mr-2">{selectedCrmFilter || "All CRMs"}</span>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isCrmDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isCrmDropdownOpen && (
                        <div className="absolute top-full mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto overflow-x-hidden animate-fade-in">
                            <button
                                onClick={() => { setSelectedCrmFilter(null); setIsCrmDropdownOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-between ${!selectedCrmFilter ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700'}`}
                            >
                                All CRMs
                                {!selectedCrmFilter && <Check className="h-3.5 w-3.5" />}
                            </button>
                            {uniqueCrms.map((crm) => {
                                const isSelected = selectedCrmFilter?.toLowerCase() === crm.toLowerCase();
                                return (
                                    <button
                                        key={crm}
                                        onClick={() => { setSelectedCrmFilter(crm); setIsCrmDropdownOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-between ${isSelected ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700'}`}
                                    >
                                        <span className="truncate">{crm}</span>
                                        {isSelected && <Check className="h-3.5 w-3.5" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
            
            {activeMainTab === 'credentials' && selectedCrmFilter && (
                <div className="md:hidden flex items-center bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100 animate-fade-in">
                    <span className="text-xs font-semibold mr-2">Filtered: {selectedCrmFilter}</span>
                    <button onClick={() => setSelectedCrmFilter(null)} className="p-0.5 hover:bg-indigo-100 rounded-full transition-colors"><X className="h-3.5 w-3.5" /></button>
                </div>
            )}

            <div className="relative group w-full md:w-64 lg:w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 sm:text-sm transition-all shadow-sm"
                    placeholder={activeMainTab === 'credentials' ? "Search credentials..." : "Search submissions..."}
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
            </div>
           <div className="flex-shrink-0">
               {activeMainTab === 'credentials' && (
                 <Button onClick={openAddModal} className="w-full sm:w-auto"><Plus className="h-5 w-5 mr-2" />Add Credential</Button>
               )}
               {activeMainTab === 'submissions' && (
                 <Button onClick={() => setIsWebhookModalOpen(true)} className="w-full sm:w-auto"><LinkIcon className="h-5 w-5 mr-2" />Integration Info</Button>
               )}
           </div>
        </div>
      </div>

      {/* Demo Mode Warning */}
      {demoMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start animate-fade-in">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-amber-800">Database Connection: Demo Mode</h3>
            <p className="mt-1 text-sm text-amber-700">The required database table for <strong>{activeFormTab}</strong> was not found.</p>
            <button onClick={() => setIsSqlModalOpen(true)} className="mt-2 flex items-center text-sm font-semibold text-amber-800 hover:text-amber-900 group">
              <Terminal className="h-4 w-4 mr-1.5" /><span className="group-hover:underline">View SQL Setup Script</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => { setActiveMainTab('credentials'); setSearchQuery(''); setCurrentPage(1); setExpandedSubmissionId(null); setSelectedCrmFilter(null); }}
            className={`${activeMainTab === 'credentials' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all outline-none focus:outline-none focus:ring-0 focus-visible:outline-none`}
          >
            <Lock className={`-ml-0.5 mr-2 h-5 w-5 ${activeMainTab === 'credentials' ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
            <span>Credentials Vault</span>
            <span className={`ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium inline-block ${activeMainTab === 'credentials' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>{credentials.length}</span>
          </button>
          <button
            onClick={() => { setActiveMainTab('submissions'); setSearchQuery(''); setCurrentPage(1); setExpandedSubmissionId(null); setSelectedCrmFilter(null); }}
            className={`${activeMainTab === 'submissions' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all outline-none focus:outline-none focus:ring-0 focus-visible:outline-none`}
          >
            <Inbox className={`-ml-0.5 mr-2 h-5 w-5 ${activeMainTab === 'submissions' ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
            <span>Form Intelligence</span>
             <span className={`ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium inline-block ${activeMainTab === 'submissions' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>{totalSubmissionsCount}</span>
          </button>
        </nav>
      </div>

      {/* CREDENTIALS TAB CONTENT */}
      {activeMainTab === 'credentials' && (
        <section key="credentials-section" className="animate-fade-in">
          {isLoadingCredentials ? (
             <div className="flex flex-col items-center justify-center h-64 mt-8">
               <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
               <p className="text-gray-500 font-medium">Decrypting Vault...</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {currentCredentials.map((cred) => {
                const crmStyle = getCrmStyle(cred.serviceName);
                return (
                  <div key={cred.id} className="group relative bg-white rounded-xl border border-gray-200 p-5 transition-all hover:shadow-md hover:border-indigo-200 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3 max-w-[70%]">
                        <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-indigo-50 transition-colors flex-shrink-0">
                          <Building className="h-5 w-5 text-indigo-500" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 truncate" title={cred.clientName}>{cred.clientName}</h3>
                          {/* Left side actions on hover for quick access */}
                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity -ml-1 mt-1">
                             <button onClick={() => openEditModal(cred)} className="p-1 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors outline-none focus:outline-none"><Pencil className="h-3.5 w-3.5" /></button>
                             <button onClick={(e) => openDeleteModal(cred.id, e)} className="p-1 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors outline-none focus:outline-none"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right Side - Highlighted CRM Badge */}
                      <button 
                         onClick={() => setSelectedCrmFilter(prev => prev && prev.toLowerCase() === cred.serviceName.toLowerCase() ? null : cred.serviceName)}
                         className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${crmStyle.bg} ${crmStyle.text} ${crmStyle.border} ${crmStyle.hover}`}
                         title="Filter by this CRM"
                      >
                         {cred.serviceName}
                      </button>
                    </div>
                    
                    <div className="space-y-3 flex-1 mt-2">
                      {cred.crmLink && (
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">CRM Link</label>
                          <div className="flex items-center justify-between mt-1">
                            <a href={cred.crmLink} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline truncate mr-2">
                              <LinkIcon className="h-3 w-3 mr-1.5 flex-shrink-0" />
                              <span className="truncate">{cred.crmLink}</span>
                              <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0 opacity-50" />
                            </a>
                            <button onClick={() => handleCopy(cred.crmLink)} className="text-gray-400 hover:text-indigo-600 focus:outline-none outline-none p-1 rounded hover:bg-gray-100 transition-colors" title="Copy Link">
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Login Email</label>
                        <div className="flex items-center justify-between text-sm font-medium text-gray-700 bg-gray-50 px-3 py-2 rounded-lg mt-1">
                          <span className="truncate mr-2">{cred.username}</span>
                          <button onClick={() => handleCopy(cred.username)} className="text-gray-400 hover:text-indigo-600 focus:outline-none outline-none flex-shrink-0 p-1 rounded hover:bg-gray-200 transition-colors" title="Copy Email">
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Password</label>
                        <div className="flex items-center justify-between text-sm font-medium text-gray-700 bg-gray-50 px-3 py-2 rounded-lg mt-1 font-mono">
                          <span className="truncate mr-2">{visiblePasswords[cred.id] ? cred.password : '••••••••••••'}</span>
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <button onClick={() => handleCopy(cred.password)} className="text-gray-400 hover:text-indigo-600 focus:outline-none outline-none p-1 rounded hover:bg-gray-200 transition-colors" title="Copy Password">
                              <Copy className="h-3 w-3" />
                            </button>
                            <button onClick={() => togglePassword(cred.id)} className="text-gray-400 hover:text-indigo-600 focus:outline-none outline-none p-1 rounded hover:bg-gray-200 transition-colors" title={visiblePasswords[cred.id] ? "Hide Password" : "Show Password"}>
                              {visiblePasswords[cred.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                      <span>Updated: {new Date(cred.lastUpdated).toLocaleDateString()}</span>
                      <Shield className="h-3 w-3 text-emerald-500" />
                    </div>
                  </div>
                );
              })}
              {(currentPage === totalPages || totalItems === 0) && !searchQuery && !selectedCrmFilter && (
                <button onClick={openAddModal} className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/10 transition-all text-gray-400 hover:text-indigo-500 h-full min-h-[220px] outline-none focus:outline-none">
                  <div className="p-3 rounded-full bg-gray-50 mb-3 group-hover:bg-white"><Plus className="h-6 w-6" /></div>
                  <span className="font-medium">Add New Key</span>
                </button>
              )}
            </div>
          )}
          <PaginationControls />
        </section>
      )}

      {/* FORM SUBMISSIONS TAB CONTENT */}
      {activeMainTab === 'submissions' && (
        <section key="submissions-section" className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-6 min-h-[500px] flex flex-col animate-fade-in">
          <div className="bg-gray-50/80 border-b border-gray-200">
            <div className="px-2 pt-2 pb-0 flex overflow-x-auto space-x-1 scrollbar-hide">
              {FORM_TYPES.map((type) => {
                const isActive = activeFormTab === type;
                const count = formCounts[type] || 0;
                return (
                  <button
                    key={type}
                    onClick={() => { setActiveFormTab(type); setSearchQuery(''); setCurrentPage(1); setExpandedSubmissionId(null); }}
                    className={`whitespace-nowrap flex items-center px-4 py-3 text-sm font-medium rounded-t-lg transition-colors border-b-2 outline-none focus:outline-none focus:ring-0 ${isActive ? 'bg-white text-indigo-600 border-indigo-500 shadow-[0_-1px_2px_rgba(0,0,0,0.02)]' : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-100'}`}
                  >
                    <FileText className={`h-4 w-4 mr-2 ${isActive ? 'text-indigo-500' : 'text-gray-400'}`} />
                    {type}
                    {count > 0 && <span className={`ml-2 text-xs py-0.5 px-2 rounded-full ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-200 text-gray-600'}`}>{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6 flex-1 bg-slate-50">
             {isLoadingSubmissions ? (
                 <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                   <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-3" />
                   <p className="text-gray-500 text-sm">Synchronizing Streams...</p>
                 </div>
             ) : filteredSubmissions.length > 0 ? (
                <div key={activeFormTab} className="flex flex-col space-y-3 animate-fade-in">
                  {currentSubmissions.map((submission) => {
                    const isExpanded = expandedSubmissionId === submission.id;
                    const payloadKeys = Object.keys(submission.payload);
                    
                    const priorityKeys = ['full_name', 'business_name', 'client_name', 'company_name', 'legal_name', 'Full Name', 'Business Name', 'Client Name'];
                    let titleKey = priorityKeys.find(pk => payloadKeys.includes(pk));
                    if (!titleKey) titleKey = payloadKeys.find(k => /^(full|client|business|company|legal)[_\s]?name$/i.test(k));
                    if (!titleKey) titleKey = payloadKeys.find(k => (/name|business|company|client/i.test(k) && !/bot/i.test(k)));
                    if (!titleKey) titleKey = payloadKeys[0];

                    const titleValue = submission.payload[titleKey] || 'New Submission';
                    const emailKey = payloadKeys.find(k => /email/i.test(k));
                    const emailValue = emailKey ? submission.payload[emailKey] : null;
                    const statusColorClass = submission.status === 'processed' ? 'border-l-emerald-500' : submission.status === 'flagged' ? 'border-l-rose-500' : 'border-l-amber-500';

                    // Updated sorting logic: Name -> Email -> AI Tasks -> A2P -> Simpletalk
                    const sortedPayloadKeys = [...payloadKeys].sort((a, b) => {
                         const getPriority = (k: string) => {
                            const lower = k.toLowerCase();
                            // Order: Name -> Email -> AI Tasks -> A2P -> Simpletalk -> Others
                            if (/client.?name|full.?name|business.?name/i.test(lower) && !/bot|campaign|agent/i.test(lower)) return 1;
                            if (/email/i.test(lower)) return 2;
                            if (/ai.?task|bot.?goal|primary.?bot/i.test(lower)) return 3;
                            if (/a2p/i.test(lower)) return 4;
                            if (/simpletalk/i.test(lower)) return 5;
                            return 100;
                         };
                         const sA = getPriority(a);
                         const sB = getPriority(b);
                         if (sA !== sB) return sA - sB;
                         return a.localeCompare(b);
                    });

                    return (
                      <div key={submission.id} className={`bg-white rounded-lg border-l-4 border-y border-r transition-all duration-300 ${statusColorClass} ${isExpanded ? 'border-y-indigo-200 border-r-indigo-200 shadow-md' : 'border-y-gray-200 border-r-gray-200 hover:border-y-indigo-200 hover:border-r-indigo-200 hover:shadow-sm'}`}>
                        <div onClick={() => toggleSubmission(submission.id)} className="p-4 flex items-center justify-between cursor-pointer group select-none relative">
                           <div className="flex items-center space-x-4 flex-1 min-w-0">
                               <div className="hidden sm:block">
                                    <div className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-400 group-hover:text-indigo-500'}`}>
                                        <FileText className="h-5 w-5" />
                                    </div>
                               </div>
                               <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                   <div className="md:col-span-5 flex flex-col justify-center">
                                       <h4 className="text-sm font-bold text-gray-900 truncate">{String(titleValue)}</h4>
                                       <div className="flex items-center text-xs text-gray-400 mt-1">
                                           <span className="truncate">{submission.id.substring(0, 8)}...</span>
                                           <span className="mx-1.5 text-gray-300">•</span>
                                           <span className="truncate text-gray-500">{submission.source}</span>
                                       </div>
                                   </div>
                                   <div className="md:col-span-4 hidden md:block flex items-center justify-center">
                                       {emailValue ? <span className="text-sm text-gray-600 truncate flex items-center justify-center w-full">{String(emailValue)}</span> : <span className="text-sm text-gray-400 italic">No email</span>}
                                   </div>
                                   <div className="md:col-span-3 flex items-center justify-end space-x-4">
                                        <div className="flex flex-col items-end">
                                            {/* Status Dropdown Component Replaces Static Badge */}
                                            <StatusDropdown status={submission.status} id={submission.id} />
                                            <span className="text-[10px] text-gray-400 font-medium">{new Date(submission.timestamp).toLocaleDateString()}</span>
                                        </div>
                                   </div>
                               </div>
                           </div>
                           <div className="ml-6 flex items-center space-x-1">
                               {/* Removed Eye Button */}
                               <button onClick={(e) => handleEditSubmissionClick(submission, e)} className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors outline-none focus:outline-none"><Pencil className="h-4 w-4" /></button>
                               {/* Delete Button Removed */}
                               <div className="pl-2 border-l border-gray-100 ml-2 text-gray-300 group-hover:text-indigo-500 transition-colors transform duration-300">{isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}</div>
                           </div>
                        </div>

                        {/* Smooth Expansion Panel using CSS Grid Transition */}
                        <div className={`grid transition-grid-rows ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                           <div className="overflow-hidden">
                               <div className="px-4 pb-4 pt-0 border-t border-gray-100 bg-gray-50/50">
                                   <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                       {sortedPayloadKeys.map((key) => {
                                           const label = formatLabel(key);
                                           const value = submission.payload[key];
                                           const displayValue = value === null || value === undefined || String(value) === 'null' ? '—' : String(value);
                                           const charCount = displayValue.length;
                                           let spanClass = charCount > 100 ? 'md:col-span-2 lg:col-span-3' : charCount > 50 ? 'md:col-span-2' : 'col-span-1';

                                           const isSimpletalk = /simpletalk/i.test(key);
                                           let customStyle = "bg-white border-gray-200/60 text-gray-900";

                                           if (isSimpletalk) {
                                               const isPositive = /yes|true|active|enabled/i.test(String(value));
                                               customStyle = isPositive
                                                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                                    : "bg-rose-50 border-rose-200 text-rose-800";
                                           }

                                           return (
                                               <div key={key} className={`p-4 rounded-xl border shadow-sm flex flex-col items-start gap-1.5 hover:border-indigo-200 transition-all ${spanClass} ${customStyle}`}>
                                                   <span className={`text-[10px] font-bold uppercase tracking-widest ${isSimpletalk ? 'opacity-80' : 'text-gray-400'}`}>{label}</span>
                                                   <span className="text-sm font-medium leading-relaxed break-words w-full">{displayValue}</span>
                                               </div>
                                           );
                                       })}
                                   </div>
                                   <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3">
                                       <div className="flex items-center text-xs text-gray-500"><Globe className="h-3 w-3 mr-1" /><span>IP: {submission.ipAddress}</span></div>
                                   </div>
                               </div>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-400">
                  <div className="bg-white p-4 rounded-full mb-3 shadow-sm"><Inbox className="h-8 w-8 text-gray-300" /></div>
                  {searchQuery ? <><p className="text-sm font-medium">No results found for "{searchQuery}"</p><p className="text-xs mt-1">Try adjusting your search terms</p></> : <><p className="text-sm font-medium">No data received for {activeFormTab}.</p><p className="text-xs mt-1">Waiting for incoming webhooks...</p></>}
                </div>
             )}
          </div>
          <PaginationControls />
        </section>
      )}

      {/* WEBHOOK INTEGRATION MODAL */}
      <Modal isOpen={isWebhookModalOpen} onClose={() => setIsWebhookModalOpen(false)} title="Integration Endpoints" maxWidth="2xl">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-start">
             <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
             <div>
               <p className="font-semibold">Backend Deployment Required</p>
               <p className="mt-1">The URLs below point to Supabase Edge Functions. If you haven't deployed the 'clever-worker' function yet, visiting these URLs will result in a "Function not found" error.</p>
             </div>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-800">
             <p>Use these URLs to POST JSON data from external forms (Typeform, HighLevel, etc.). Data is automatically securely stored in the appropriate table.</p>
          </div>
          <div className="space-y-3">
             {FORM_TYPES.map((type, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{type}</span>
                      <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-mono">Table: {TABLE_MAP[type]}</span>
                   </div>
                   <div className="flex items-center bg-gray-50 rounded border border-gray-200 px-2 py-1.5 mt-1">
                      <code className="text-xs text-gray-600 flex-1 truncate font-mono">
                        https://qqxdfqerllirceqiwyex.supabase.co/functions/v1/clever-worker?source={encodeURIComponent(type)}
                      </code>
                      <button 
                        onClick={() => navigator.clipboard.writeText(`https://qqxdfqerllirceqiwyex.supabase.co/functions/v1/clever-worker?source=${encodeURIComponent(type)}`)}
                        className="ml-2 text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                      >
                        Copy
                      </button>
                   </div>
                </div>
             ))}
          </div>
          <div className="pt-2 text-right">
             <Button variant="secondary" onClick={() => setIsWebhookModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>

      {/* SQL SETUP MODAL */}
      <Modal isOpen={isSqlModalOpen} onClose={() => setIsSqlModalOpen(false)} title="Database Setup SQL" maxWidth="4xl">
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700">
            <p><strong>Missing Tables Detected:</strong> The application requires 5 specific tables to store form data.</p>
            <p className="mt-1">Copy the SQL code below and run it in your Supabase SQL Editor to create the tables and enable all features.</p>
          </div>
          <div className="relative">
            <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg text-xs overflow-x-auto font-mono leading-relaxed h-96 border border-slate-700 shadow-inner">
              {SETUP_SQL}
            </pre>
            <div className="absolute top-2 right-2">
              <button 
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-white flex items-center transition-colors"
                onClick={() => navigator.clipboard.writeText(SETUP_SQL)}
                title="Copy SQL"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setIsSqlModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal isOpen={deleteConfirmation.isOpen} onClose={() => setDeleteConfirmation({ isOpen: false, id: null })} title="Confirm Deletion" maxWidth="sm">
        <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-rose-600" />
            </div>
            <div>
                <h4 className="text-lg font-medium text-gray-900">Delete Credential?</h4>
                <p className="text-sm text-gray-500 mt-1">This action cannot be undone. The credential and all its associated metadata will be permanently removed from the vault.</p>
            </div>
            <div className="flex w-full space-x-3 mt-4">
                <Button variant="secondary" onClick={() => setDeleteConfirmation({ isOpen: false, id: null })} className="flex-1">Cancel</Button>
                <Button variant="danger" onClick={confirmDeleteCredential} className="flex-1">Delete</Button>
            </div>
        </div>
      </Modal>

      {/* ADD/EDIT CREDENTIAL MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={editingId ? "Edit Credential" : "Store New Credential"}>
        <form onSubmit={handleSaveCredential} className="space-y-4">
          <Input label="Client Name" placeholder="e.g. Acme Corp" value={newCred.clientName} onChange={(e) => setNewCred({...newCred, clientName: e.target.value})} required autoFocus />
          
          {/* Custom CRM Autocomplete Input */}
          <div className="relative" ref={crmInputWrapperRef}>
             <Input 
                label="CRM Name" 
                placeholder="e.g. HubSpot CRM" 
                value={newCred.serviceName} 
                onChange={(e) => {
                    setNewCred({...newCred, serviceName: e.target.value});
                    setShowCrmSuggestions(true);
                }}
                onFocus={() => setShowCrmSuggestions(true)}
                required 
                autoComplete="off"
             />
             {showCrmSuggestions && (
                 <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 max-h-48 overflow-y-auto animate-fade-in">
                      {(() => {
                          const input = newCred.serviceName.toLowerCase();
                          const existing = Array.from(new Set(credentials.map(c => c.serviceName))).filter(Boolean);
                          const all = Array.from(new Set([...existing, ...COMMON_CRMS]));
                          const filtered = input 
                             ? all.filter(c => String(c).toLowerCase().includes(input)) 
                             : all;
                          const finalSuggestions = filtered.sort();

                          if (finalSuggestions.length === 0) {
                              return <div className="px-4 py-3 text-sm text-gray-400 italic">Type to create new...</div>;
                          }

                          return finalSuggestions.map((crm) => (
                              <button
                                 key={crm}
                                 type="button"
                                 onClick={() => {
                                     setNewCred({ ...newCred, serviceName: crm });
                                     setShowCrmSuggestions(false);
                                 }}
                                 className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border-b border-gray-50 last:border-0 block truncate"
                              >
                                 {crm}
                              </button>
                          ));
                      })()}
                 </div>
             )}
          </div>

          <Input label="CRM Link" placeholder="https://..." value={newCred.crmLink} onChange={(e) => setNewCred({...newCred, crmLink: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Login Email" placeholder="user@example.com" value={newCred.username} onChange={(e) => setNewCred({...newCred, username: e.target.value})} required />
            <Input label="Password" type="password" placeholder="••••••••" value={newCred.password} onChange={(e) => setNewCred({...newCred, password: e.target.value})} required />
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSavingCredential}>{editingId ? "Save Changes" : "Securely Save"}</Button>
          </div>
        </form>
      </Modal>

      {/* EDIT SUBMISSION MODAL */}
      <Modal isOpen={isEditSubmissionModalOpen} onClose={() => setIsEditSubmissionModalOpen(false)} title="Edit Submission Data" maxWidth="2xl">
        {editingSubmission && (
          <form onSubmit={handleSaveSubmission} className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start">
               <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
               <div className="ml-3">
                 <h4 className="text-sm font-semibold text-amber-800">Data Integrity Warning</h4>
                 <p className="text-xs text-amber-700 mt-0.5">Editing raw submission payloads directly updates the database record. Ensure data format consistency for downstream integrations.</p>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {Object.entries(editingSubmission.payload).map(([key, value]) => {
                 const stringValue = String(value);
                 const isLongText = stringValue.length > 60;
                 return (
                   <div key={key} className={isLongText ? "md:col-span-2" : ""}>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{formatLabel(key)}</label>
                      {isLongText ? (
                          <textarea 
                            rows={3} 
                            className="appearance-none block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-colors" 
                            value={stringValue} 
                            onChange={(e) => handlePayloadChange(key, e.target.value)} 
                          />
                      ) : (
                          <input 
                            type="text" 
                            className="appearance-none block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-colors" 
                            value={stringValue} 
                            onChange={(e) => handlePayloadChange(key, e.target.value)} 
                          />
                      )}
                   </div>
                 );
               })}
            </div>

            <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100">
              <Button type="button" variant="secondary" onClick={() => setIsEditSubmissionModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
};

export default DashboardPage;