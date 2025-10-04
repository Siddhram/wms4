"use client";

import DashboardLayout from '@/components/dashboard-layout';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';import { Card, CardContent } from '@/components/ui/card';
import { Download, ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { FiltersAndControls } from '@/components/reports/FiltersAndControls';

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
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [commodityFilter, setCommodityFilter] = useState('all');
  const [insuranceManagedByFilter, setInsuranceManagedByFilter] = useState('all');
  
  // Data and UI states
  const [loading, setLoading] = useState(false);
  const [insuranceData, setInsuranceData] = useState<InsuranceReportData[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'state', 'branch', 'location', 'typeOfBusiness', 'warehouseType', 'warehouseCode', 'warehouseName', 'warehouseAddress',
    'clientCode', 'clientName', 'commodity', 'variety', 'bankName', 'bankBranchName', 'bankState', 'ifscCode',
    'balanceBags', 'balanceQty', 'insuranceManagedBy', 'rate', 'aum', 'firePolicyNumber', 'firePolicySumInsured',
    'firePolicyStartDate', 'firePolicyEndDate', 'burglaryPolicyNumber', 'burglaryPolicySumInsured', 'burglaryPolicyStartDate', 'burglaryPolicyEndDate'
  ]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
    return Array.from(new Set(insuranceData.map(item => item.warehouseName).filter(Boolean))).sort();
  }, [insuranceData]);

  const uniqueStates = useMemo(() => {
    return Array.from(new Set(insuranceData.map(item => item.state).filter(Boolean))).sort();
  }, [insuranceData]);

  const uniqueBranches = useMemo(() => {
    return Array.from(new Set(insuranceData.map(item => item.branch).filter(Boolean))).sort();
  }, [insuranceData]);

  const uniqueClients = useMemo(() => {
    return Array.from(new Set(insuranceData.map(item => item.clientName).filter(Boolean))).sort();
  }, [insuranceData]);

  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(insuranceData.map(item => item.status).filter(Boolean))).sort();
  }, [insuranceData]);

  const uniqueCommodities = useMemo(() => {
    return Array.from(new Set(insuranceData.map(item => item.commodity).filter(Boolean))).sort();
  }, [insuranceData]);

  const uniqueInsuranceManagedBy = useMemo(() => {
    return Array.from(new Set(insuranceData.map(item => item.insuranceManagedBy).filter(Boolean))).sort();
  }, [insuranceData]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, warehouseFilter, stateFilter, branchFilter, clientFilter, commodityFilter, insuranceManagedByFilter, itemsPerPage]);

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
    
    // Apply all filters
    if (warehouseFilter && warehouseFilter !== 'all') {
      filtered = filtered.filter(item => item.warehouseName === warehouseFilter);
    }

    if (stateFilter && stateFilter !== 'all') {
      filtered = filtered.filter(item => item.state === stateFilter);
    }

    if (branchFilter && branchFilter !== 'all') {
      filtered = filtered.filter(item => item.branch === branchFilter);
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (clientFilter && clientFilter !== 'all') {
      filtered = filtered.filter(item => item.clientName === clientFilter);
    }

    if (commodityFilter && commodityFilter !== 'all') {
      filtered = filtered.filter(item => item.commodity === commodityFilter);
    }

    if (insuranceManagedByFilter && insuranceManagedByFilter !== 'all') {
      filtered = filtered.filter(item => item.insuranceManagedBy === insuranceManagedByFilter);
    }
    
    return filtered;
  }, [insuranceData, searchTerm, statusFilter, warehouseFilter, stateFilter, branchFilter, clientFilter, commodityFilter, insuranceManagedByFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Pagination functions
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPage = (page: number) => setCurrentPage(page);

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
    setCommodityFilter('all');
    setInsuranceManagedByFilter('all');
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || warehouseFilter !== 'all' || stateFilter !== 'all' || 
    branchFilter !== 'all' || clientFilter !== 'all' || commodityFilter !== 'all' || insuranceManagedByFilter !== 'all';

  // Toggle column visibility
  const toggleColumn = (columnKey: string) => {
    setVisibleColumns(prev => 
      prev.includes(columnKey) 
        ? prev.filter(col => col !== columnKey)
        : [...prev, columnKey]
    );
  };

  // Filter options for the modular component
  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      options: uniqueStatuses
    },
    {
      key: 'warehouse',
      label: 'Warehouse',
      value: warehouseFilter,
      options: uniqueWarehouses
    },
    {
      key: 'state',
      label: 'State',
      value: stateFilter,
      options: uniqueStates
    },
    {
      key: 'branch',
      label: 'Branch',
      value: branchFilter,
      options: uniqueBranches
    },
    {
      key: 'client',
      label: 'Client',
      value: clientFilter,
      options: uniqueClients
    },
    {
      key: 'commodity',
      label: 'Commodity',
      value: commodityFilter,
      options: uniqueCommodities
    },
    {
      key: 'insuranceManagedBy',
      label: 'Insurance Managed By',
      value: insuranceManagedByFilter,
      options: uniqueInsuranceManagedBy
    }
  ];

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    switch (key) {
      case 'status':
        setStatusFilter(value);
        break;
      case 'warehouse':
        setWarehouseFilter(value);
        break;
      case 'state':
        setStateFilter(value);
        break;
      case 'branch':
        setBranchFilter(value);
        break;
      case 'client':
        setClientFilter(value);
        break;
      case 'commodity':
        setCommodityFilter(value);
        break;
      case 'insuranceManagedBy':
        setInsuranceManagedByFilter(value);
        break;
    }
  };

  // Active filters for display
  const activeFilters = filterOptions
    .filter(filter => filter.value !== 'all')
    .map(filter => ({
      key: filter.key,
      label: filter.label,
      value: filter.value,
      onRemove: () => handleFilterChange(filter.key, 'all')
    }));

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

        {/* Filters & Controls - Modular Component */}
        <FiltersAndControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
          loading={loading}
          onApplyFilters={fetchInsuranceData}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          allColumns={allColumns}
          visibleColumns={visibleColumns}
          onToggleColumn={toggleColumn}
          onClearFilters={clearFilters}
          activeFilters={activeFilters}
        />

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} entries
            {filteredData.length !== insuranceData.length && ` (filtered from ${insuranceData.length} total)`}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Data Table with Sticky Headers */}
        <div className="table-container">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full border-collapse border border-gray-200">
                  <thead className="sticky-header bg-orange-100">
                    <tr>
                      {allColumns
                        .filter(col => visibleColumns.includes(col.key))
                        .map(column => (
                          <th key={column.key} className="border border-orange-300 px-4 py-3 text-left text-orange-800 font-semibold whitespace-nowrap">
                            {column.label}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        {allColumns
                          .filter(col => visibleColumns.includes(col.key))
                          .map(column => (
                            <td key={column.key} className="border border-gray-200 px-4 py-2 whitespace-nowrap">
                              {column.key === 'firePolicyStartDate' || column.key === 'firePolicyEndDate' || 
                               column.key === 'burglaryPolicyStartDate' || column.key === 'burglaryPolicyEndDate' ? (
                                <span className={isPolicyExpired(item[column.key]) && column.key.includes('EndDate') ? 'text-red-600 font-medium' : ''}>
                                  {formatDate(item[column.key])}
                                </span>
                              ) : column.key === 'firePolicySumInsured' || column.key === 'burglaryPolicySumInsured' ||
                                       column.key === 'balanceBags' || column.key === 'balanceQty' || 
                                       column.key === 'rate' || column.key === 'aum' ? (
                                <span className="text-right block">
                                  {item[column.key] || '-'}
                                </span>
                              ) : column.key === 'warehouseCode' || column.key === 'clientCode' || 
                                       column.key === 'firePolicyNumber' || column.key === 'burglaryPolicyNumber' || 
                                       column.key === 'ifscCode' ? (
                                <span className="font-mono text-sm">
                                  {item[column.key] || '-'}
                                </span>
                              ) : (
                                item[column.key] || '-'
                              )}
                            </td>
                          ))}
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

        {/* Pagination Controls */}
        {filteredData.length > 0 && (
          <Card>
            <CardContent className="flex items-center justify-between space-x-2 py-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNumber <= totalPages) {
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    );
                  }
                  return null;
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-sm text-gray-500">
                {filteredData.length} total entries
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
