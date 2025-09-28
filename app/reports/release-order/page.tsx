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
import { collection, getDocs, query, orderBy, limit, where, getDoc, doc, Timestamp } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

interface ReleaseOrderReportData {
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
  bankBranch: string;
  bankState: string;
  ifscCode: string;
  inwardBag: string;
  inwardQty: string;
  roNumber: string;
  roDate: string;
  roBags: string;
  roQty: string;
  roCode: string;
  balanceBag: string;
  balanceQty: string;
  [key: string]: any;
}

export default function ReleaseOrderReportsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');

  const [loading, setLoading] = useState(false);
  const [roData, setRoData] = useState<ReleaseOrderReportData[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'state', 'branch', 'location', 'typeOfBusiness', 'warehouseType', 'warehouseCode', 'warehouseName',
    'warehouseAddress', 'clientCode', 'clientName', 'commodity', 'variety', 'bankName', 'bankBranch',
    'bankState', 'ifscCode', 'inwardBag', 'inwardQty', 'roNumber', 'roDate', 'roBags', 'roQty',
    'roCode', 'balanceBag', 'balanceQty'
  ]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Column definitions for 25 columns matching the image parameters
  const allColumns = [
    { key: 'state', label: 'State', width: 'w-20' },
    { key: 'branch', label: 'Branch', width: 'w-20' },
    { key: 'location', label: 'Location', width: 'w-24' },
    { key: 'typeOfBusiness', label: 'Type of Business', width: 'w-28' },
    { key: 'warehouseType', label: 'Warehouse Type', width: 'w-28' },
    { key: 'warehouseCode', label: 'Warehouse Code', width: 'w-24' },
    { key: 'warehouseName', label: 'Warehouse Name', width: 'w-32' },
    { key: 'warehouseAddress', label: 'Warehouse Address', width: 'w-32' },
    { key: 'clientCode', label: 'Client Code', width: 'w-24' },
    { key: 'clientName', label: 'Client Name', width: 'w-28' },
    { key: 'commodity', label: 'Commodity', width: 'w-24' },
    { key: 'variety', label: 'Variety', width: 'w-24' },
    { key: 'bankName', label: 'Bank Name', width: 'w-24' },
    { key: 'bankBranch', label: 'Bank Branch', width: 'w-24' },
    { key: 'bankState', label: 'Bank State', width: 'w-20' },
    { key: 'ifscCode', label: 'IFSC Code', width: 'w-24' },
    { key: 'inwardBag', label: 'Inward Bag', width: 'w-20' },
    { key: 'inwardQty', label: 'Inward Qty', width: 'w-20' },
    { key: 'roNumber', label: 'RO Number', width: 'w-24' },
    { key: 'roDate', label: 'RO Date', width: 'w-24' },
    { key: 'roBags', label: 'RO bags', width: 'w-20' },
    { key: 'roQty', label: 'RO Qty (MT)', width: 'w-24' },
    { key: 'roCode', label: 'RO Code', width: 'w-20' },
    { key: 'balanceBag', label: 'Balance Bag', width: 'w-20' },
    { key: 'balanceQty', label: 'Balance QT', width: 'w-20' }
  ];

  // Fetch release order data
  useEffect(() => {
    fetchROData();
  }, []);

  // Set default date range (last 6 months)
  useEffect(() => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(sixMonthsAgo.toISOString().split('T')[0]);
  }, []);

  const fetchROData = async () => {
    setLoading(true);
    try {
      const roCollection = collection(db, 'releaseOrders');
      
      // Build query with date filters
      let q = query(roCollection, orderBy('createdAt', 'desc'), limit(1000));
      
      // Apply date filters if dates are set
      if (startDate && endDate) {
        const startTimestamp = Timestamp.fromDate(new Date(startDate));
        const endTimestamp = Timestamp.fromDate(new Date(endDate + 'T23:59:59'));
        
        q = query(
          roCollection,
          where('createdAt', '>=', startTimestamp),
          where('createdAt', '<=', endTimestamp),
          orderBy('createdAt', 'desc'),
          limit(1000)
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      console.log('RO collection query result:', querySnapshot.size, 'documents');
      
      const data = await Promise.all(querySnapshot.docs.map(async (doc, index) => {
        const docData = doc.data();
        
        // Debug: Log available fields in RO data
        console.log('RO document fields for warehouse:', docData.warehouseName, Object.keys(docData));
        console.log('RO document data:', docData);
        console.log('Balance data in RO:', {
          balanceBags: docData.balanceBags,
          balanceQuantity: docData.balanceQuantity,
          totalBags: docData.totalBags,
          totalQuantity: docData.totalQuantity,
          releaseBags: docData.releaseBags,
          releaseQuantity: docData.releaseQuantity
        });
        
        // Fetch warehouse type from inspections collection (same logic as inward report)
        let warehouseType = '';
        let warehouseCode = '';
        let warehouseAddress = '';
        let businessType = '';
        
        if (docData.warehouseName) {
          console.log('Looking for warehouse type for warehouse name:', docData.warehouseName);
          try {
            // Fetch warehouse type from inspections collection where typeOfWarehouse field is present
            try {
              console.log(`Fetching warehouse type from inspections collection for warehouse: ${docData.warehouseName}`);
              
              // Query inspections collection with database location filter if available
              let inspectionsQuery;
              if (docData.databaseLocation) {
                inspectionsQuery = query(
                  collection(db, 'inspections'),
                  where('warehouseName', '==', docData.warehouseName),
                  where('databaseLocation', '==', docData.databaseLocation)
                );
              } else {
                inspectionsQuery = query(
                  collection(db, 'inspections'),
                  where('warehouseName', '==', docData.warehouseName)
                );
              }
              
              const inspectionsSnapshot = await getDocs(inspectionsQuery);
              console.log('Inspections query result:', inspectionsSnapshot.size, 'documents');
              
              if (!inspectionsSnapshot.empty) {
                const inspectionData = inspectionsSnapshot.docs[0].data();
                console.log('Inspections data found:', inspectionData);
                console.log('Available fields in inspections:', Object.keys(inspectionData));
                
                // Get warehouse type from typeOfWarehouse field (correct field name)
                warehouseType = inspectionData.typeOfWarehouse || 
                              inspectionData.typeofwarehouse || 
                              inspectionData.warehouseType || 
                              inspectionData.warehouseInspectionData?.typeOfWarehouse ||
                              inspectionData.warehouseInspectionData?.warehouseType || '';
                
                // Get other warehouse details from inspections
                warehouseCode = inspectionData.warehouseCode || 
                              inspectionData.warehouseInspectionData?.warehouseCode || '';
                warehouseAddress = inspectionData.warehouseAddress || 
                                inspectionData.warehouseInspectionData?.warehouseAddress || '';
                businessType = inspectionData.businessType || 
                             inspectionData.warehouseInspectionData?.businessType || '';
                
                console.log('Extracted warehouse type from inspections:', warehouseType);
                console.log('Warehouse code from inspections:', warehouseCode);
              } else {
                console.log('No inspections data found for warehouse:', docData.warehouseName);
              }
            } catch (error) {
              console.log('Error fetching from inspections collection:', error);
            }
            
            console.log('Final extracted warehouse type:', warehouseType);
            console.log('Warehouse type will be displayed as:', warehouseType || '-');
          } catch (error) {
            console.log('Error fetching warehouse type from warehouse creation:', error);
          }
        }
        
        // Fetch additional data from inward collection using inwardId
        let commodity = '';
        let variety = '';
        let bankFields = {
          bankName: '',
          bankBranch: '',
          bankState: '',
          ifscCode: ''
        };
        
        if (docData.inwardId) {
          try {
            console.log('Fetching additional data from inward collection for inwardId:', docData.inwardId);
            const inwardCollection = collection(db, 'inward');
            const inwardQuery = query(
              inwardCollection,
              where('inwardId', '==', docData.inwardId)
            );
            const inwardSnapshot = await getDocs(inwardQuery);
            
            if (!inwardSnapshot.empty) {
              const inwardData = inwardSnapshot.docs[0].data();
              console.log('Inward data found:', inwardData);
              
              // Extract commodity and variety from inward data
              commodity = inwardData.commodity || '';
              variety = inwardData.varietyName || inwardData.variety || '';
              
              // Extract bank information from inward data (same logic as inward report)
              bankFields = {
                bankName: inwardData.bankName || inwardData.bank || inwardData.selectedBankName || '',
                bankBranch: inwardData.bankBranchName || inwardData.bankBranch || inwardData.branchName || inwardData.selectedBankBranchName || '',
                bankState: inwardData.bankState || inwardData.selectedBankState || '',
                ifscCode: inwardData.ifscCode || inwardData.IFSC || inwardData.ifsc || ''
              };
              
              console.log('Extracted data from inward collection:', {
                commodity,
                variety,
                bankFields
              });
            } else {
              console.log('No inward data found for inwardId:', docData.inwardId);
            }
          } catch (error) {
            console.log('Error fetching inward data:', error);
          }
        }
        
        // If still missing bank information, try to fetch from clients collection
        if ((!bankFields.bankName || !bankFields.bankBranch) && (docData.clientCode || docData.client)) {
          try {
            console.log('Bank information still missing, fetching from clients collection for client:', docData.clientCode || docData.client);
            const clientsCollection = collection(db, 'clients');
            const clientQuery = query(
              clientsCollection,
              where('clientId', '==', docData.clientCode || docData.client)
            );
            const clientSnapshot = await getDocs(clientQuery);
            
            if (!clientSnapshot.empty) {
              const clientData = clientSnapshot.docs[0].data();
              console.log('Client data found:', clientData);
              
              // Update bank fields if they're missing
              if (!bankFields.bankName && clientData.bankName) {
                bankFields.bankName = clientData.bankName;
              }
              if (!bankFields.bankBranch && clientData.bankBranch) {
                bankFields.bankBranch = clientData.bankBranch;
              }
              if (!bankFields.bankState && clientData.bankState) {
                bankFields.bankState = clientData.bankState;
              }
              if (!bankFields.ifscCode && clientData.ifscCode) {
                bankFields.ifscCode = clientData.ifscCode;
              }
              
              console.log('Updated bank fields from client data:', bankFields);
            }
          } catch (error) {
            console.log('Error fetching client data for bank information:', error);
          }
        }
        
        // Calculate balance values if not present
        const calculatedBalanceBags = docData.balanceBags || (docData.totalBags && docData.releaseBags ? (docData.totalBags - docData.releaseBags).toString() : '');
        const calculatedBalanceQty = docData.balanceQuantity || (docData.totalQuantity && docData.releaseQuantity ? (docData.totalQuantity - docData.releaseQuantity).toString() : '');
        
        console.log('Balance calculation for warehouse:', docData.warehouseName, {
          totalBags: docData.totalBags,
          releaseBags: docData.releaseBags,
          calculatedBalanceBags,
          totalQuantity: docData.totalQuantity,
          releaseQuantity: docData.releaseQuantity,
          calculatedBalanceQty
        });
        
        return {
          id: doc.id,
          state: docData.state || '',
          branch: docData.branch || '',
          location: docData.location || '',
          typeOfBusiness: businessType || docData.businessType || docData.typeOfBusiness || '',
          warehouseType: warehouseType,
          warehouseCode: warehouseCode || docData.warehouseCode || '',
          warehouseName: docData.warehouseName || '',
          warehouseAddress: warehouseAddress || docData.warehouseAddress || '',
          clientCode: docData.clientCode || '',
          clientName: docData.client || '',
          commodity: commodity,
          variety: variety,
          bankName: bankFields.bankName,
          bankBranch: bankFields.bankBranch,
          bankState: bankFields.bankState,
          ifscCode: bankFields.ifscCode,
          inwardBag: docData.totalBags || '',
          inwardQty: docData.totalQuantity || '',
          roNumber: docData.roCode || '',
          roDate: docData.createdAt || '',
          roBags: docData.releaseBags || '',
          roQty: docData.releaseQuantity || '',
          roCode: docData.roCode || '',
          balanceBag: calculatedBalanceBags,
          balanceQty: calculatedBalanceQty,
          ...docData
        };
      }));
      
      console.log('Processed RO data:', data.length, 'records');
      setRoData(data);
    } catch (error) {
      console.error('Error fetching RO data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique filter options
  const uniqueStates = useMemo(() => {
    return Array.from(new Set(roData.map(item => item.state).filter(Boolean)));
  }, [roData]);

  const uniqueBranches = useMemo(() => {
    return Array.from(new Set(roData.map(item => item.branch).filter(Boolean)));
  }, [roData]);

  const uniqueWarehouses = useMemo(() => {
    return Array.from(new Set(roData.map(item => item.warehouseName).filter(Boolean)));
  }, [roData]);

  const uniqueClients = useMemo(() => {
    return Array.from(new Set(roData.map(item => item.clientName).filter(Boolean)));
  }, [roData]);

  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(roData.map(item => item.status).filter(Boolean)));
  }, [roData]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, warehouseFilter, clientFilter, itemsPerPage]);

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    let filtered = roData;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
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
  }, [roData, searchTerm, statusFilter, warehouseFilter, clientFilter]);

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
      'State', 'Branch', 'Location', 'Type of Business', 'Warehouse Type', 'Warehouse Code', 'Warehouse Name',
      'Warehouse Address', 'Client Code', 'Client Name', 'Commodity', 'Variety', 'Bank Name', 'Bank Branch',
      'Bank State', 'IFSC Code', 'Inward Bag', 'Inward Qty', 'RO Number', 'RO Date', 'RO bags', 'RO Qty (MT)',
      'RO Code', 'Balance Bag', 'Balance QT'
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
        row.bankBranch || '',
        row.bankState || '',
        row.ifscCode || '',
        row.inwardBag || '',
        row.inwardQty || '',
        row.roNumber || '',
        row.roDate || '',
        row.roBags || '',
        row.roQty || '',
        row.roCode || '',
        row.balanceBag || '',
        row.balanceQty || ''
      ].map(value => typeof value === 'string' && value.includes(',') ? `"${value}"` : value).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `release_order_report_${startDate}_to_${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setWarehouseFilter('all');
    setClientFilter('all');
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || warehouseFilter !== 'all' || clientFilter !== 'all';

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
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
    if (normalizedStatus.includes('approved') || normalizedStatus.includes('active') || normalizedStatus.includes('completed')) {
      return 'bg-green-100 text-green-800';
    } else if (normalizedStatus.includes('pending')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (normalizedStatus.includes('rejected') || normalizedStatus.includes('expired') || normalizedStatus.includes('cancelled')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  // Handle date change with validation
  const handleDateChange = (field: 'start' | 'end', value: string) => {
    if (field === 'start') {
      setStartDate(value);
      // Ensure end date is not more than 6 months after start date
      if (value && endDate) {
        const start = new Date(value);
        const end = new Date(endDate);
        const sixMonthsLater = new Date(start);
        sixMonthsLater.setMonth(start.getMonth() + 6);
        
        if (end > sixMonthsLater) {
          setEndDate(sixMonthsLater.toISOString().split('T')[0]);
        }
      }
    } else {
      setEndDate(value);
      // Ensure start date is not more than 6 months before end date
      if (value && startDate) {
        const start = new Date(startDate);
        const end = new Date(value);
        const sixMonthsBefore = new Date(end);
        sixMonthsBefore.setMonth(end.getMonth() - 6);
        
        if (start < sixMonthsBefore) {
          setStartDate(sixMonthsBefore.toISOString().split('T')[0]);
        }
      }
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

  // Get visible columns data
  const visibleColumnsData = allColumns.filter(col => visibleColumns.includes(col.key));

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
              Release Order Reports
            </h1>
            <p className="text-muted-foreground">Generate and view release order transaction reports</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">


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
                    {statusFilter !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                        Status: {statusFilter}
                        <button onClick={() => setStatusFilter('all')} className="ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {clientFilter !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
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
            Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} entries
            {filteredData.length !== roData.length && ` (filtered from ${roData.length} total)`}
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
                    {visibleColumns.includes('state') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">State</th>}
                    {visibleColumns.includes('branch') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Branch</th>}
                    {visibleColumns.includes('location') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Location</th>}
                    {visibleColumns.includes('typeOfBusiness') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Type of Business</th>}
                    {visibleColumns.includes('warehouseType') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Warehouse Type</th>}
                    {visibleColumns.includes('warehouseCode') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Warehouse Code</th>}
                    {visibleColumns.includes('warehouseName') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Warehouse Name</th>}
                    {visibleColumns.includes('warehouseAddress') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Warehouse Address</th>}
                    {visibleColumns.includes('clientCode') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Client Code</th>}
                    {visibleColumns.includes('clientName') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Client Name</th>}
                    {visibleColumns.includes('commodity') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Commodity</th>}
                    {visibleColumns.includes('variety') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Variety</th>}
                    {visibleColumns.includes('bankName') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Bank Name</th>}
                    {visibleColumns.includes('bankBranch') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Bank Branch</th>}
                    {visibleColumns.includes('bankState') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Bank State</th>}
                    {visibleColumns.includes('ifscCode') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">IFSC Code</th>}
                    {visibleColumns.includes('inwardBag') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Inward Bag</th>}
                    {visibleColumns.includes('inwardQty') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Inward Qty</th>}
                    {visibleColumns.includes('roNumber') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">RO Number</th>}
                    {visibleColumns.includes('roDate') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">RO Date</th>}
                    {visibleColumns.includes('roBags') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">RO bags</th>}
                    {visibleColumns.includes('roQty') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">RO Qty (MT)</th>}
                    {visibleColumns.includes('roCode') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">RO Code</th>}
                    {visibleColumns.includes('balanceBag') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Balance Bag</th>}
                    {visibleColumns.includes('balanceQty') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Balance QT</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
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
                      {visibleColumns.includes('typeOfBusiness') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.typeOfBusiness || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('warehouseType') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.warehouseType || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('warehouseCode') && (
                        <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                          {item.warehouseCode || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('warehouseName') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.warehouseName || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('warehouseAddress') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.warehouseAddress || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('clientCode') && (
                        <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                          {item.clientCode || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('clientName') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.clientName || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('commodity') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.commodity || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('variety') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.variety || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('bankName') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.bankName || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('bankBranch') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.bankBranch || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('bankState') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.bankState || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('ifscCode') && (
                        <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                          {item.ifscCode || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('inwardBag') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {item.inwardBag || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('inwardQty') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {item.inwardQty || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('roNumber') && (
                        <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                          {item.roNumber || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('roDate') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {formatDate(item.roDate)}
                        </td>
                      )}
                      {visibleColumns.includes('roBags') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {item.roBags || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('roQty') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {item.roQty || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('roCode') && (
                        <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                          {item.roCode || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('balanceBag') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {item.balanceBag || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('balanceQty') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {item.balanceQty || '-'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {loading ? 'Loading data...' : 'No release order data found matching the current filters'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
