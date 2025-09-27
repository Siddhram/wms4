"use client";

import DashboardLayout from '@/components/dashboard-layout';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Calendar, Filter, X, ArrowLeft, Shield, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, where, getDoc, doc, Timestamp } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

interface InsuranceReportData {
  id: string;
  state: string;
  branch: string;
  location: string;
  typeOfBusiness: string;
  warehouseType: string;
  warehouseCode: string;
  warehouseName: string;
  warehouseAddress: string;
  clientCode: string;
  clientName: string;
  commodity: string;
  variety: string;
  bankName: string;
  bankBranchName: string;
  bankState: string;
  ifscCode: string;
  balanceBags: string;
  balanceQty: string;
  insuranceManagedBy: string;
  rate: string;
  aum: string;
  firePolicyNumber: string;
  firePolicySumInsured: string;
  firePolicyStartDate: string;
  firePolicyEndDate: string;
  burglaryPolicyNumber: string;
  burglaryPolicySumInsured: string;
  burglaryPolicyStartDate: string;
  burglaryPolicyEndDate: string;
  [key: string]: any;
}

export default function InsuranceReportsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [insuranceData, setInsuranceData] = useState<InsuranceReportData[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'state', 'branch', 'location', 'typeOfBusiness', 'warehouseType', 'warehouseCode', 'warehouseName', 'warehouseAddress',
    'clientCode', 'clientName', 'commodity', 'variety', 'bankName', 'bankBranchName', 'bankState', 'ifscCode',
    'balanceBags', 'balanceQty', 'insuranceManagedBy', 'rate', 'aum', 'firePolicyNumber', 'firePolicySumInsured',
    'firePolicyStartDate', 'firePolicyEndDate', 'burglaryPolicyNumber', 'burglaryPolicySumInsured', 'burglaryPolicyStartDate', 'burglaryPolicyEndDate'
  ]);

  // Column definitions for table - 28 columns matching the image
  const allColumns = [
    { key: 'state', label: 'State', width: 'w-24' },
    { key: 'branch', label: 'Branch', width: 'w-24' },
    { key: 'location', label: 'Location', width: 'w-24' },
    { key: 'typeOfBusiness', label: 'Type of Business', width: 'w-32' },
    { key: 'warehouseType', label: 'Warehouse Type', width: 'w-28' },
    { key: 'warehouseCode', label: 'Warehouse Code', width: 'w-28' },
    { key: 'warehouseName', label: 'Warehouse Name', width: 'w-32' },
    { key: 'warehouseAddress', label: 'Warehouse Address', width: 'w-36' },
    { key: 'clientCode', label: 'Client Code', width: 'w-24' },
    { key: 'clientName', label: 'Client Name', width: 'w-28' },
    { key: 'commodity', label: 'Commodity', width: 'w-24' },
    { key: 'variety', label: 'Variety', width: 'w-24' },
    { key: 'bankName', label: 'Bank Name', width: 'w-28' },
    { key: 'bankBranchName', label: 'Bank Branch Name', width: 'w-32' },
    { key: 'bankState', label: 'Bank State', width: 'w-24' },
    { key: 'ifscCode', label: 'IFSC Code', width: 'w-24' },
    { key: 'balanceBags', label: 'Balance Bags', width: 'w-24' },
    { key: 'balanceQty', label: 'Balance Qty', width: 'w-24' },
    { key: 'insuranceManagedBy', label: 'Insurance Managed By', width: 'w-32' },
    { key: 'rate', label: 'Rate', width: 'w-20' },
    { key: 'aum', label: 'AUM', width: 'w-20' },
    { key: 'firePolicyNumber', label: 'Fire Policy Number', width: 'w-28' },
    { key: 'firePolicySumInsured', label: 'Fire Policy Sum Insured', width: 'w-32' },
    { key: 'firePolicyStartDate', label: 'Fire Policy Start Date', width: 'w-28' },
    { key: 'firePolicyEndDate', label: 'Fire Policy End Date', width: 'w-28' },
    { key: 'burglaryPolicyNumber', label: 'Burglary Policy Number', width: 'w-32' },
    { key: 'burglaryPolicySumInsured', label: 'Burglary Policy Sum Insured', width: 'w-36' },
    { key: 'burglaryPolicyStartDate', label: 'Burglary Policy Start Date', width: 'w-32' },
    { key: 'burglaryPolicyEndDate', label: 'Burglary Policy End Date', width: 'w-32' }
  ];

  // Set default date range (6 months ago to today)
  useEffect(() => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(sixMonthsAgo.toISOString().split('T')[0]);
  }, []);

  // Fetch insurance data
  useEffect(() => {
    fetchInsuranceData();
  }, []);

  const fetchInsuranceData = async () => {
    setLoading(true);
    try {
      const data: InsuranceReportData[] = [];
      
      // Fetch from Insurance Master collection (single source of truth for updated amounts)
      console.log('🔍 INSURANCE REPORT: Fetching from Insurance Master collection...');
      const insuranceSnap = await getDocs(collection(db, 'insurance'));
      console.log('📊 Insurance Master query result:', insuranceSnap.size, 'documents');
      
      // Also fetch inspections for warehouse details
      const inspectionsSnap = await getDocs(collection(db, 'inspections'));
      console.log('📊 Inspections query result:', inspectionsSnap.size, 'documents');
      
      // Create a map of warehouse details from inspections
      const warehouseDetailsMap = new Map();
      inspectionsSnap.docs.forEach(doc => {
        const docData = doc.data();
        if (docData.status === 'activated' || docData.status === 'reactivate') {
          warehouseDetailsMap.set(docData.warehouseName, {
            warehouseCode: docData.warehouseCode,
            address: docData.address || docData.warehouseInspectionData?.address || '',
            state: docData.state || docData.warehouseInspectionData?.state || '',
            branch: docData.branch || docData.warehouseInspectionData?.branch || '',
            location: docData.location || docData.warehouseInspectionData?.location || '',
          });
        }
      });
      
      // Process insurance master data with warehouse details
      insuranceSnap.docs.forEach(doc => {
        const insuranceData = doc.data();
        const warehouseDetails = warehouseDetailsMap.get(insuranceData.warehouseName) || {};
        
        console.log(`Processing insurance for warehouse: ${insuranceData.warehouseName}`, {
          firePolicyAmount: insuranceData.firePolicyAmount,
          firePolicyRemainingAmount: insuranceData.firePolicyRemainingAmount,
          burglaryPolicyAmount: insuranceData.burglaryPolicyAmount,
          burglaryPolicyRemainingAmount: insuranceData.burglaryPolicyRemainingAmount
        });
        
        data.push({
          id: doc.id,
          state: insuranceData.state || warehouseDetails.state || '',
          branch: insuranceData.branch || warehouseDetails.branch || '',
          location: insuranceData.location || warehouseDetails.location || '',
          typeOfBusiness: insuranceData.insuranceType || '',
          warehouseType: insuranceData.warehouseType || '',
          warehouseCode: insuranceData.warehouseCode || warehouseDetails.warehouseCode || '',
          warehouseName: insuranceData.warehouseName || '',
          warehouseAddress: warehouseDetails.address || '',
          clientCode: insuranceData.clientCode || '',
          clientName: insuranceData.clientName || '',
          commodity: insuranceData.commodityName || '',
          variety: insuranceData.varietyName || '',
          bankName: insuranceData.bankFundedBy || '',
          bankBranchName: insuranceData.bankBranchName || '',
          bankState: insuranceData.bankState || '',
          ifscCode: insuranceData.ifscCode || '',
          balanceBags: insuranceData.balanceBags || '',
          balanceQty: insuranceData.balanceQty || '',
          insuranceManagedBy: insuranceData.insuranceType || '',
          rate: insuranceData.rate || '',
          aum: insuranceData.aum || '',
          // Policy details with updated amounts from Insurance Master
          firePolicyNumber: insuranceData.firePolicyNumber || '',
          firePolicySumInsured: insuranceData.firePolicyRemainingAmount || insuranceData.firePolicyAmount || '',
          firePolicyStartDate: insuranceData.firePolicyStartDate || '',
          firePolicyEndDate: insuranceData.firePolicyEndDate || '',
          burglaryPolicyNumber: insuranceData.burglaryPolicyNumber || '',
          burglaryPolicySumInsured: insuranceData.burglaryPolicyRemainingAmount || insuranceData.burglaryPolicyAmount || '',
          burglaryPolicyStartDate: insuranceData.burglaryPolicyStartDate || '',
          burglaryPolicyEndDate: insuranceData.burglaryPolicyEndDate || ''
        });
      });
      
      console.log('Total insurance data:', data.length, 'records');
      setInsuranceData(data);
    } catch (error) {
      console.error('Error fetching insurance data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique filter options
  const uniqueWarehouses = useMemo(() => {
    return Array.from(new Set(insuranceData.map(item => item.warehouseName).filter(Boolean)));
  }, [insuranceData]);

  const uniqueStates = useMemo(() => {
    return Array.from(new Set(insuranceData.map(item => item.state).filter(Boolean)));
  }, [insuranceData]);

  const uniqueBranches = useMemo(() => {
    return Array.from(new Set(insuranceData.map(item => item.branch).filter(Boolean)));
  }, [insuranceData]);

  const uniqueClients = useMemo(() => {
    return Array.from(new Set(insuranceData.map(item => item.clientName).filter(Boolean)));
  }, [insuranceData]);

  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(insuranceData.map(item => item.status).filter(Boolean)));
  }, [insuranceData]);

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    let filtered = insuranceData;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Apply warehouse filter
    if (warehouseFilter && warehouseFilter !== 'all') {
      filtered = filtered.filter(item => item.warehouseName === warehouseFilter);
    }

    // Apply state filter
    if (stateFilter && stateFilter !== 'all') {
      filtered = filtered.filter(item => item.state === stateFilter);
    }

    // Apply branch filter
    if (branchFilter && branchFilter !== 'all') {
      filtered = filtered.filter(item => item.branch === branchFilter);
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Apply warehouse filter
    if (warehouseFilter && warehouseFilter !== 'all') {
      filtered = filtered.filter(item => item.warehouseName === warehouseFilter);
    }

    // Apply client filter
    if (clientFilter && clientFilter !== 'all') {
      filtered = filtered.filter(item => item.clientName === clientFilter);
    }
    
    return filtered;
  }, [insuranceData, searchTerm, statusFilter, warehouseFilter, stateFilter, branchFilter, clientFilter]);

  // Export filtered data to CSV
  const exportToCSV = () => {
    if (filteredData.length === 0) return;
    
    const headers = [
      'State', 'Branch', 'Location', 'Type of Business', 'Warehouse Type', 'Warehouse Code', 'Warehouse Name', 'Warehouse Address',
      'Client Code', 'Client Name', 'Commodity', 'Variety', 'Bank Name', 'Bank Branch Name', 'Bank State', 'IFSC Code',
      'Balance Bags', 'Balance Qty', 'Insurance Managed By', 'Rate', 'AUM', 'Fire Policy Number', 'Fire Policy Sum Insured',
      'Fire Policy Start Date', 'Fire Policy End Date', 'Burglary Policy Number', 'Burglary Policy Sum Insured', 'Burglary Policy Start Date', 'Burglary Policy End Date'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => [
        row.state || '',
        row.branch || '',
        row.location || '',
        row.typeOfBusiness || '',
        row.warehouseType || '',
        row.warehouseCode || '',
        row.warehouseName || '',
        row.warehouseAddress || '',
        row.clientCode || '',
        row.clientName || '',
        row.commodity || '',
        row.variety || '',
        row.bankName || '',
        row.bankBranchName || '',
        row.bankState || '',
        row.ifscCode || '',
        row.balanceBags || '',
        row.balanceQty || '',
        row.insuranceManagedBy || '',
        row.rate || '',
        row.aum || '',
        row.firePolicyNumber || '',
        row.firePolicySumInsured || '',
        row.firePolicyStartDate || '',
        row.firePolicyEndDate || '',
        row.burglaryPolicyNumber || '',
        row.burglaryPolicySumInsured || '',
        row.burglaryPolicyStartDate || '',
        row.burglaryPolicyEndDate || ''
      ].map(value => typeof value === 'string' && value.includes(',') ? `"${value}"` : value).join(','))
    ].join('\n');
    
    const filename = startDate && endDate 
      ? `insurance_report_${startDate}_to_${endDate}.csv`
      : `insurance_report_${new Date().toISOString().split('T')[0]}.csv`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setWarehouseFilter('all');
    setStateFilter('all');
    setBranchFilter('all');
    setClientFilter('all');
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || warehouseFilter !== 'all' || stateFilter !== 'all' || branchFilter !== 'all' || clientFilter !== 'all';

  // Handle date change with 6-month limit
  const handleDateChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setStartDate(value);
      // Ensure end date is not more than 6 months from start date
      if (endDate && value) {
        const start = new Date(value);
        const maxEnd = new Date(start);
        maxEnd.setMonth(maxEnd.getMonth() + 6);
        if (new Date(endDate) > maxEnd) {
          setEndDate(maxEnd.toISOString().split('T')[0]);
        }
      }
    } else {
      setEndDate(value);
    }
  };

  // Toggle column visibility
  const toggleColumn = (columnKey: string) => {
    setVisibleColumns(prev => 
      prev.includes(columnKey) 
        ? prev.filter(col => col !== columnKey)
        : [...prev, columnKey]
    );
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || '';
    if (normalizedStatus.includes('approved') || normalizedStatus.includes('active') || normalizedStatus.includes('valid')) {
      return 'bg-green-100 text-green-800';
    } else if (normalizedStatus.includes('pending')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (normalizedStatus.includes('rejected') || normalizedStatus.includes('expired') || normalizedStatus.includes('cancelled')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  // Check if policy is expired
  const isPolicyExpired = (endDate: string) => {
    if (!endDate) return false;
    try {
      const end = new Date(endDate);
      const today = new Date();
      return end < today;
    } catch {
      return false;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push('/reports')}
              className="inline-flex items-center text-lg font-semibold tracking-tight bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Reports
            </button>
          </div>
          
          <div className="text-center flex flex-col items-center">
            {/* Logo */}
            <div className="w-36 h-10 relative mb-3 bg-white rounded-lg px-2 py-1">
              {/* <Image 
                src="/AGlogo.webp" 
                alt="AgroGreen Logo" 
                fill
                className="object-contain"
                priority
              /> */}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-orange-600 inline-block border-b-4 border-green-500 pb-2 px-6 py-3 bg-orange-100 rounded-lg">
              Insurance Reports
            </h1>
            <p className="text-muted-foreground">Generate and view insurance policy reports</p>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={exportToCSV} disabled={filteredData.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Search & Filter Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search across all fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t">
                  {/* Date Range Filter */}
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => handleDateChange('start', e.target.value)}
                      max={endDate}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => handleDateChange('end', e.target.value)}
                      min={startDate}
                      max={(() => {
                        if (startDate) {
                          const maxDate = new Date(startDate);
                          maxDate.setMonth(maxDate.getMonth() + 6);
                          return maxDate.toISOString().split('T')[0];
                        }
                        return '';
                      })()}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Max 6 months range</p>
                  </div>

                  <div>
                    <Label htmlFor="statusFilter">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {uniqueStatuses.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="warehouseFilter">Warehouse</Label>
                    <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Warehouses</SelectItem>
                        {uniqueWarehouses.map(warehouse => (
                          <SelectItem key={warehouse} value={warehouse}>{warehouse}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="clientFilter">Client</Label>
                    <Select value={clientFilter} onValueChange={setClientFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Clients</SelectItem>
                        {uniqueClients.map(client => (
                          <SelectItem key={client} value={client}>{client}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Additional Filters Row */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="stateFilter">State</Label>
                    <Select value={stateFilter} onValueChange={setStateFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All States</SelectItem>
                        {uniqueStates.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="branchFilter">Branch</Label>
                    <Select value={branchFilter} onValueChange={setBranchFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        {uniqueBranches.map(branch => (
                          <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          Column Visibility
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {allColumns.map((column) => (
                          <DropdownMenuCheckboxItem
                            key={column.key}
                            checked={visibleColumns.includes(column.key)}
                            onCheckedChange={() => toggleColumn(column.key)}
                          >
                            {column.label}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}

              {/* Active Filters Summary */}
              {hasActiveFilters && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Active Filters:</span>
                    {searchTerm && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        Search: {searchTerm}
                        <button onClick={() => setSearchTerm('')} className="ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {warehouseFilter !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                        Warehouse: {warehouseFilter}
                        <button onClick={() => setWarehouseFilter('all')} className="ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {stateFilter !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-teal-100 text-teal-800">
                        State: {stateFilter}
                        <button onClick={() => setStateFilter('all')} className="ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {branchFilter !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
                        Branch: {branchFilter}
                        <button onClick={() => setBranchFilter('all')} className="ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {statusFilter !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                        Status: {statusFilter}
                        <button onClick={() => setStatusFilter('all')} className="ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {warehouseFilter !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                        Warehouse: {warehouseFilter}
                        <button onClick={() => setWarehouseFilter('all')} className="ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {clientFilter !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-teal-100 text-teal-800">
                        Client: {clientFilter}
                        <button onClick={() => setClientFilter('all')} className="ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                  </div>
                  <Button variant="outline" onClick={clearFilters} size="sm">
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredData.length} of {insuranceData.length} records
            {hasActiveFilters && ` (filtered)`}
            {startDate && endDate && ` | Date Range: ${startDate} to ${endDate}`}
          </div>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} size="sm">
              Clear Filters
            </Button>
          )}
        </div>

        {/* Data Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-orange-100">
                  <tr>
                    {visibleColumns.includes('date') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Date</th>}
                    {visibleColumns.includes('warehouseName') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Warehouse Name</th>}
                    {visibleColumns.includes('warehouseCode') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Warehouse Code</th>}
                    {visibleColumns.includes('state') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">State</th>}
                    {visibleColumns.includes('branch') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Branch</th>}
                    {visibleColumns.includes('location') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Location</th>}
                    {visibleColumns.includes('insuranceTakenBy') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Insurance Taken By</th>}
                    {visibleColumns.includes('insuranceCommodity') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Commodity</th>}
                    {visibleColumns.includes('clientName') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Client Name</th>}
                    {visibleColumns.includes('clientAddress') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Client Address</th>}
                    {visibleColumns.includes('selectedBankName') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Bank Name</th>}
                    {visibleColumns.includes('firePolicyCompanyName') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Fire Policy Company</th>}
                    {visibleColumns.includes('firePolicyNumber') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Fire Policy Number</th>}
                    {visibleColumns.includes('firePolicyAmount') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Fire Policy Amount</th>}
                    {visibleColumns.includes('firePolicyStartDate') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Fire Policy Start</th>}
                    {visibleColumns.includes('firePolicyEndDate') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Fire Policy End</th>}
                    {visibleColumns.includes('burglaryPolicyCompanyName') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Burglary Policy Company</th>}
                    {visibleColumns.includes('burglaryPolicyNumber') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Burglary Policy Number</th>}
                    {visibleColumns.includes('burglaryPolicyAmount') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Burglary Policy Amount</th>}
                    {visibleColumns.includes('burglaryPolicyStartDate') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Burglary Policy Start</th>}
                    {visibleColumns.includes('burglaryPolicyEndDate') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Burglary Policy End</th>}
                    {visibleColumns.includes('remainingFirePolicyAmount') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Remaining Fire Amount</th>}
                    {visibleColumns.includes('remainingBurglaryPolicyAmount') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Remaining Burglary Amount</th>}
                    {visibleColumns.includes('status') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Status</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {visibleColumns.includes('date') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {formatDate(item.date)}
                        </td>
                      )}
                      {visibleColumns.includes('srNumber') && (
                        <td className="border border-gray-200 px-4 py-2 text-center font-mono text-sm">
                          {item.srNumber || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('warehouseName') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.warehouseName || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('warehouseCode') && (
                        <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                          {item.warehouseCode || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('state') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.state || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('branch') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.branch || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('location') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.location || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('insuranceTakenBy') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.insuranceTakenBy || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('insuranceCommodity') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.insuranceCommodity || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('clientName') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.clientName || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('clientAddress') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.clientAddress || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('selectedBankName') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.selectedBankName || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('firePolicyCompanyName') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.firePolicyCompanyName || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('firePolicyNumber') && (
                        <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                          {item.firePolicyNumber || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('firePolicyAmount') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {item.firePolicyAmount || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('firePolicyStartDate') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {formatDate(item.firePolicyStartDate)}
                        </td>
                      )}
                      {visibleColumns.includes('firePolicyEndDate') && (
                        <td className="border border-gray-200 px-4 py-2">
                          <span className={isPolicyExpired(item.firePolicyEndDate) ? 'text-red-600 font-medium' : ''}>
                            {formatDate(item.firePolicyEndDate)}
                          </span>
                        </td>
                      )}
                      {visibleColumns.includes('burglaryPolicyCompanyName') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.burglaryPolicyCompanyName || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('burglaryPolicyNumber') && (
                        <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                          {item.burglaryPolicyNumber || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('burglaryPolicyAmount') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {item.burglaryPolicyAmount || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('burglaryPolicyStartDate') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {formatDate(item.burglaryPolicyStartDate)}
                        </td>
                      )}
                      {visibleColumns.includes('burglaryPolicyEndDate') && (
                        <td className="border border-gray-200 px-4 py-2">
                          <span className={isPolicyExpired(item.burglaryPolicyEndDate) ? 'text-red-600 font-medium' : ''}>
                            {formatDate(item.burglaryPolicyEndDate)}
                          </span>
                        </td>
                      )}
                      {visibleColumns.includes('remainingFirePolicyAmount') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {item.remainingFirePolicyAmount || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('remainingBurglaryPolicyAmount') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {item.remainingBurglaryPolicyAmount || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('status') && (
                        <td className="border border-gray-200 px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status || 'Active'}
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {loading ? 'Loading data...' : 'No insurance data found matching the current filters'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
