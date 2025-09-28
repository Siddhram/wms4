"use client";

import DashboardLayout from '@/components/dashboard-layout';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Calendar, Filter, X, ArrowLeft, Eye, EyeOff, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

interface InwardReportData {
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
  cadNumber: string;
  inwardDate: string;
  srWrNumber: string;
  srWrDate: string;
  fundingSrWrDate: string;
  srLastValidityDate: string;
  totalBags: string;
  totalQty: string;
  roBags: string;
  roQty: string;
  doBags: string;
  doQty: string;
  balanceBags: string;
  balanceQty: string;
  insuranceManagedBy: string;
  rate: string;
  aum: string;
  databaseLocation: string;
  [key: string]: any;
}

export default function InwardReportsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [inwardData, setInwardData] = useState<InwardReportData[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Column definitions matching the exact format requested
  const allColumns = [
    { key: 'state', label: 'State', width: 'w-20' },
    { key: 'branch', label: 'Branch', width: 'w-20' },
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
    { key: 'cadNumber', label: 'CAD Number', width: 'w-24' },
    { key: 'inwardDate', label: 'Inward Date', width: 'w-28' },
    { key: 'srWrNumber', label: 'SR/WR Number', width: 'w-32' },
    { key: 'srWrDate', label: 'SR/WR Date', width: 'w-28' },
    { key: 'fundingSrWrDate', label: 'Funding SR/WR Date', width: 'w-36' },
    { key: 'srLastValidityDate', label: 'SR Last Validity Date', width: 'w-32' },
    { key: 'totalBags', label: 'Total Bags', width: 'w-24' },
    { key: 'totalQty', label: 'Total Qty(MT)', width: 'w-28' },
    { key: 'roBags', label: 'RO Bags', width: 'w-20' },
    { key: 'roQty', label: 'RO Qty (MT)', width: 'w-24' },
    { key: 'doBags', label: 'DO Bags', width: 'w-20' },
    { key: 'doQty', label: 'DO Qty (MT)', width: 'w-24' },
    { key: 'balanceBags', label: 'Balance Bags', width: 'w-24' },
    { key: 'balanceQty', label: 'Balance Qty (MT)', width: 'w-28' },
    { key: 'insuranceManagedBy', label: 'Insurance Managed by', width: 'w-32' },
    { key: 'rate', label: 'Rate (Rs/MT)', width: 'w-24' },
    { key: 'aum', label: 'AUM(Rs/MT)', width: 'w-24' }
  ];

  const [visibleColumns, setVisibleColumns] = useState<string[]>(allColumns.map(col => col.key));

  // Fetch inward data
  useEffect(() => {
    fetchInwardData();
  }, []);

  // Set default date range (last 6 months)
  useEffect(() => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(sixMonthsAgo.toISOString().split('T')[0]);
  }, []);

  const fetchInwardData = async () => {
    setLoading(true);
    try {
      console.log('Starting inward data fetch...');
      
      // Fetch from main inward collection
      const inwardCollection = collection(db, 'inward');
          
          // Build query with date filters
          let q = query(inwardCollection, orderBy('createdAt', 'desc'), limit(1000));
          
          // Apply date filters if dates are set
          if (startDate && endDate) {
            const startTimestamp = Timestamp.fromDate(new Date(startDate));
            const endTimestamp = Timestamp.fromDate(new Date(endDate + 'T23:59:59'));
            
            q = query(
              inwardCollection,
              where('createdAt', '>=', startTimestamp),
              where('createdAt', '<=', endTimestamp),
              orderBy('createdAt', 'desc'),
              limit(1000)
            );
          }
          
          const querySnapshot = await getDocs(q);
          
      console.log('Inward collection query result:', querySnapshot.size, 'documents');
          
          if (querySnapshot.size > 0) {
        // Process each inward record with simplified logic
        const processedData = querySnapshot.docs.map((doc, index) => {
                const docData = doc.data();
                
          console.log(`Processing inward document ${index + 1}:`, doc.id);
          console.log('Available fields:', Object.keys(docData));
          
          // Debug insurance field specifically
          if (docData.insuranceManagedBy || docData.selectedInsurance) {
            console.log('Insurance field type and value:', {
              insuranceManagedBy: typeof docData.insuranceManagedBy,
              insuranceManagedByValue: docData.insuranceManagedBy,
              selectedInsurance: typeof docData.selectedInsurance,
              selectedInsuranceValue: docData.selectedInsurance
            });
          }
          
          // Format date properly
          const formatDate = (dateValue: any) => {
            if (!dateValue) return '';
            if (dateValue?.toDate) {
              return dateValue.toDate().toLocaleDateString();
            }
            if (typeof dateValue === 'string') return dateValue;
            return '';
          };

          // Extract insurance managed by value (handle object case)
          const extractInsuranceValue = (insuranceValue: any) => {
            if (!insuranceValue) return '';
            if (typeof insuranceValue === 'string') return insuranceValue;
            if (typeof insuranceValue === 'object') {
              // Handle case where insurance is an object like {insuranceTakenBy, insuranceId}
              return insuranceValue.insuranceTakenBy || insuranceValue.insuranceId || insuranceValue.name || '';
            }
            return String(insuranceValue);
          };

          // Safe string extraction helper
          const safeString = (value: any) => {
            if (!value) return '';
            if (typeof value === 'string') return value;
            if (typeof value === 'number') return String(value);
            if (typeof value === 'object') return '';
            return String(value);
          };

          // Direct field mapping from inward collection
          return {
                  id: doc.id,
            state: docData.state || docData.databaseLocation || '',
                  branch: docData.branch || '',
                  location: docData.location || '',
            typeOfBusiness: docData.typeOfBusiness || docData.businessType || '',
            warehouseType: docData.warehouseType || '',
            warehouseCode: docData.warehouseCode || '',
                  warehouseName: docData.warehouseName || '',
            warehouseAddress: docData.warehouseAddress || '',
                  clientCode: docData.clientCode || '',
            clientName: docData.clientName || docData.client || '',
            commodity: safeString(docData.commodity || docData.commodityName),
            variety: safeString(docData.variety || docData.varietyName),
            bankName: docData.bankName || '',
            bankBranchName: docData.bankBranchName || '',
            bankState: docData.bankState || '',
            ifscCode: docData.ifscCode || '',
            cadNumber: docData.cadNumber || '',
            inwardDate: formatDate(docData.inwardDate || docData.dateOfInward || docData.createdAt),
            srWrNumber: docData.srWrNumber || docData.srwrNo || docData.inwardId || '',
            srWrDate: formatDate(docData.srWrDate || docData.srwrDate),
            fundingSrWrDate: formatDate(docData.fundingSrWrDate),
            srLastValidityDate: formatDate(docData.srLastValidityDate),
            totalBags: docData.totalBags || docData.bags || '',
            totalQty: docData.totalQty || docData.quantity || '',
            roBags: docData.roBags || '',
            roQty: docData.roQty || '',
            doBags: docData.doBags || '',
            doQty: docData.doQty || '',
            balanceBags: docData.balanceBags || docData.totalBags || docData.bags || '',
            balanceQty: docData.balanceQty || docData.totalQty || docData.quantity || '',
            insuranceManagedBy: extractInsuranceValue(docData.insuranceManagedBy || docData.selectedInsurance),
            rate: safeString(docData.rate),
            aum: safeString(docData.aum),
            databaseLocation: docData.databaseLocation || ''
          };
        });
        
        console.log('Successfully processed', processedData.length, 'inward records');
        setInwardData(processedData);
      } else {
        console.log('No inward data found');
        setInwardData([]);
      }
    } catch (error) {
      console.error('Error fetching inward data:', error);
      setInwardData([]);
    } finally {
      setLoading(false);
    }
  };

  // Get unique filter options
  const uniqueWarehouses = useMemo(() => {
    return Array.from(new Set(inwardData.map(item => item.warehouseName).filter(Boolean)));
  }, [inwardData]);

  const uniqueClients = useMemo(() => {
    return Array.from(new Set(inwardData.map(item => item.clientName).filter(Boolean)));
  }, [inwardData]);

  const uniqueStates = useMemo(() => {
    return Array.from(new Set(inwardData.map(item => item.state).filter(Boolean)));
  }, [inwardData]);

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    let filtered = inwardData;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply warehouse filter
    if (warehouseFilter !== 'all') {
      filtered = filtered.filter(item => item.warehouseName === warehouseFilter);
    }

    // Apply client filter
    if (clientFilter !== 'all') {
      filtered = filtered.filter(item => item.clientName === clientFilter);
    }
    
    return filtered;
  }, [inwardData, searchTerm, warehouseFilter, clientFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, warehouseFilter, clientFilter, itemsPerPage]);

  // Export filtered data to CSV
  const exportToCSV = () => {
    if (filteredData.length === 0) return;
    
    const headers = [
      'State', 'Branch', 'Location', 'Type of Business', 'Warehouse Type', 'Warehouse Code',
      'Warehouse Name', 'Warehouse Address', 'Client Code', 'Client Name', 'Commodity', 'Variety',
      'Bank Name', 'Bank Branch Name', 'Bank State', 'IFSC Code', 'CAD Number', 'Inward Date',
      'SR/WR Number', 'SR/WR Date', 'Funding SR/WR Date', 'SR Last Validity Date',
      'Total Bags', 'Total Qty(MT)', 'RO Bags', 'RO Qty (MT)', 'DO Bags', 'DO Qty (MT)',
      'Balance Bags', 'Balance Qty (MT)', 'Insurance Managed by', 'Rate (Rs/MT)', 'AUM(Rs/MT)'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredData.map((row) => [
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
        row.cadNumber || '',
        row.inwardDate || '',
        row.srWrNumber || '',
        row.srWrDate || '',
        row.fundingSrWrDate || '',
        row.srLastValidityDate || '',
        row.totalBags || '',
        row.totalQty || '',
        row.roBags || '',
        row.roQty || '',
        row.doBags || '',
        row.doQty || '',
        row.balanceBags || '',
        row.balanceQty || '',
        row.insuranceManagedBy || '',
        row.rate || '',
        row.aum || ''
      ].map(value => typeof value === 'string' && value.includes(',') ? `"${value}"` : value).join(','))
    ].join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inward-reports-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns(prev => 
      prev.includes(columnKey) 
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const hasActiveFilters = searchTerm || warehouseFilter !== 'all' || clientFilter !== 'all';
  const visibleColumnsData = allColumns.filter(col => visibleColumns.includes(col.key));

  // Pagination functions
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPage = (page: number) => setCurrentPage(page);

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
          
            <h1 className="text-3xl font-bold tracking-tight text-orange-600 inline-block border-b-4 border-green-500 pb-2 px-6 py-3 bg-orange-100 rounded-lg">
              Stock Reports
            </h1>
            <p className="text-sm text-gray-600 mt-1">Comprehensive inward data analysis</p>
          </div>
          
          <div className="flex items-center justify-end w-48">
            <Button 
              onClick={exportToCSV} 
              disabled={filteredData.length === 0}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filters & Controls</CardTitle>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  size="sm"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? 'Hide' : 'Show'} Filters
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Columns ({visibleColumns.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 max-h-96 overflow-y-auto">
                    <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {allColumns.map(column => (
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
          </CardHeader>

          <CardContent>
            {/* Search and Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Search all fields..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
                  <div>
                <Label htmlFor="start-date">Start Date</Label>
                    <Input
                  id="start-date"
                      type="date"
                      value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                <Label htmlFor="end-date">End Date</Label>
                    <Input
                  id="end-date"
                      type="date"
                      value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                  </div>
              <div>
                <Button 
                  onClick={fetchInwardData} 
                  className="mt-6 w-full"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Apply Filters'}
                </Button>
              </div>
                  </div>

            {/* Additional Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                  <Label htmlFor="warehouse-filter">Warehouse</Label>
                    <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All warehouses" />
                      </SelectTrigger>
                      <SelectContent>
                      <SelectItem value="all">All warehouses</SelectItem>
                        {uniqueWarehouses.map(warehouse => (
                        <SelectItem key={warehouse} value={warehouse}>
                          {warehouse}
                        </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                  <Label htmlFor="client-filter">Client</Label>
                    <Select value={clientFilter} onValueChange={setClientFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All clients" />
                      </SelectTrigger>
                      <SelectContent>
                      <SelectItem value="all">All clients</SelectItem>
                        {uniqueClients.map(client => (
                        <SelectItem key={client} value={client}>
                          {client}
                        </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                <div className="flex items-end">
                  <Button 
                    onClick={() => {
                      setSearchTerm('');
                      setWarehouseFilter('all');
                      setClientFilter('all');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
            </div>
            )}
          </CardContent>
        </Card>

        {/* Results Summary & Active Filters */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredData.length > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} records
            {hasActiveFilters && ` (filtered from ${inwardData.length} total)`}
            {startDate && endDate && ` | Date Range: ${startDate} to ${endDate}`}
            {totalPages > 1 && ` | Page ${currentPage} of ${totalPages}`}
          </div>
          
          {/* Active Filter Badges */}
          <div className="flex items-center space-x-2">
            {warehouseFilter !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                Warehouse: {warehouseFilter}
                <button onClick={() => setWarehouseFilter('all')} className="ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {clientFilter !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                Client: {clientFilter}
                <button onClick={() => setClientFilter('all')} className="ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Search: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Data Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-orange-100">
                  <tr>
                    {visibleColumnsData.map((column) => (
                      <th
                        key={column.key}
                        className={`border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold ${column.width}`}
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {visibleColumns.includes('state') && (
                        <td className="border border-gray-200 px-4 py-2">{item.state || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('branch') && (
                        <td className="border border-gray-200 px-4 py-2">{item.branch || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('location') && (
                        <td className="border border-gray-200 px-4 py-2">{item.location || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('typeOfBusiness') && (
                        <td className="border border-gray-200 px-4 py-2">{item.typeOfBusiness || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('warehouseType') && (
                        <td className="border border-gray-200 px-4 py-2">{item.warehouseType || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('warehouseCode') && (
                        <td className="border border-gray-200 px-4 py-2">{item.warehouseCode || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('warehouseName') && (
                        <td className="border border-gray-200 px-4 py-2 font-medium">{item.warehouseName || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('warehouseAddress') && (
                        <td className="border border-gray-200 px-4 py-2">{item.warehouseAddress || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('clientCode') && (
                        <td className="border border-gray-200 px-4 py-2">{item.clientCode || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('clientName') && (
                        <td className="border border-gray-200 px-4 py-2 font-medium">{item.clientName || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('commodity') && (
                        <td className="border border-gray-200 px-4 py-2">{item.commodity || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('variety') && (
                        <td className="border border-gray-200 px-4 py-2">{item.variety || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('bankName') && (
                        <td className="border border-gray-200 px-4 py-2">{item.bankName || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('bankBranchName') && (
                        <td className="border border-gray-200 px-4 py-2">{item.bankBranchName || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('bankState') && (
                        <td className="border border-gray-200 px-4 py-2">{item.bankState || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('ifscCode') && (
                        <td className="border border-gray-200 px-4 py-2">{item.ifscCode || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('cadNumber') && (
                        <td className="border border-gray-200 px-4 py-2">{item.cadNumber || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('inwardDate') && (
                        <td className="border border-gray-200 px-4 py-2">{item.inwardDate || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('srWrNumber') && (
                        <td className="border border-gray-200 px-4 py-2 font-medium">{item.srWrNumber || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('srWrDate') && (
                        <td className="border border-gray-200 px-4 py-2">{item.srWrDate || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('fundingSrWrDate') && (
                        <td className="border border-gray-200 px-4 py-2">{item.fundingSrWrDate || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('srLastValidityDate') && (
                        <td className="border border-gray-200 px-4 py-2">{item.srLastValidityDate || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('totalBags') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">{item.totalBags || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('totalQty') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">{item.totalQty || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('roBags') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">{item.roBags || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('roQty') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">{item.roQty || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('doBags') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">{item.doBags || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('doQty') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">{item.doQty || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('balanceBags') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">{item.balanceBags || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('balanceQty') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">{item.balanceQty || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('insuranceManagedBy') && (
                        <td className="border border-gray-200 px-4 py-2">{item.insuranceManagedBy || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('rate') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">{item.rate || 'N/A'}</td>
                      )}
                      {visibleColumns.includes('aum') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">{item.aum || 'N/A'}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {loading ? 'Loading data...' : 'No inward data found matching the current filters'}
                </div>
              )}
            </div>
            
            {/* Pagination Controls */}
            {filteredData.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} entries
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {/* Show page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(pageNumber)}
                          className="h-8 w-8 p-0"
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}