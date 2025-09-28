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

interface OutwardReportData {
  id: string;
  date: string;
  outwardId: string;
  inwardId: string;
  doNumber: string;
  roNumber: string;
  warehouseName: string;
  warehouseType: string;
  warehouseCode: string;
  warehouseAddress: string;
  typeOfBusiness: string;
  client: string;
  commodity: string;
  varietyName: string;
  outwardBags: string;
  outwardQty: string;
  totalValue: string;
  vehicleNumber: string;
  gatepass: string;
  status: string;
  [key: string]: any;
}

export default function OutwardReportsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [commodityFilter, setCommodityFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [outwardData, setOutwardData] = useState<OutwardReportData[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'date', 'outwardId', 'inwardId', 'doNumber', 'roNumber', 'warehouseName', 'warehouseType',
    'client', 'commodity', 'varietyName', 'outwardBags', 'outwardQty', 'totalValue', 'vehicleNumber', 'gatepass', 'status'
  ]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Enhanced column definitions with additional warehouse details
  const allColumns = [
    { key: 'date', label: 'Date', width: 'w-24' },
    { key: 'outwardId', label: 'Outward ID', width: 'w-24' },
    { key: 'inwardId', label: 'Inward ID', width: 'w-24' },
    { key: 'doNumber', label: 'DO Number', width: 'w-24' },
    { key: 'roNumber', label: 'RO Number', width: 'w-24' },
    { key: 'warehouseName', label: 'Warehouse Name', width: 'w-32' },
    { key: 'warehouseType', label: 'Warehouse Type', width: 'w-28' },
    { key: 'warehouseCode', label: 'Warehouse Code', width: 'w-28' },
    { key: 'warehouseAddress', label: 'Warehouse Address', width: 'w-36' },
    { key: 'typeOfBusiness', label: 'Type of Business', width: 'w-32' },
    { key: 'client', label: 'Client', width: 'w-28' },
    { key: 'commodity', label: 'Commodity', width: 'w-24' },
    { key: 'varietyName', label: 'Variety', width: 'w-24' },
    { key: 'outwardBags', label: 'Outward Bags', width: 'w-24' },
    { key: 'outwardQty', label: 'Outward Qty (MT)', width: 'w-28' },
    { key: 'totalValue', label: 'Total Value', width: 'w-24' },
    { key: 'vehicleNumber', label: 'Vehicle Number', width: 'w-28' },
    { key: 'gatepass', label: 'Gatepass', width: 'w-24' },
    { key: 'status', label: 'Status', width: 'w-20' }
  ];

  // Fetch outward data
  useEffect(() => {
    fetchOutwardData();
  }, []);

  // Set default date range (last 6 months)
  useEffect(() => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(sixMonthsAgo.toISOString().split('T')[0]);
  }, []);

  const fetchOutwardData = async () => {
    setLoading(true);
    try {
      const outwardCollection = collection(db, 'outwards');
      
      // Build query with date filters
      let q = query(outwardCollection, orderBy('createdAt', 'desc'), limit(1000));
      
      // Apply date filters if dates are set
      if (startDate && endDate) {
        const startTimestamp = Timestamp.fromDate(new Date(startDate));
        const endTimestamp = Timestamp.fromDate(new Date(endDate + 'T23:59:59'));
        
        q = query(
          outwardCollection,
          where('createdAt', '>=', startTimestamp),
          where('createdAt', '<=', endTimestamp),
          orderBy('createdAt', 'desc'),
          limit(1000)
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      console.log('Outward collection query result:', querySnapshot.size, 'documents');
      
      const data = await Promise.all(querySnapshot.docs.map(async (doc, index) => {
        const docData = doc.data();
        
        // Debug: Log available fields in outward data
        console.log('=== OUTWARD DOCUMENT DEBUG ===');
        console.log('Outward document fields for warehouse:', docData.warehouseName, Object.keys(docData));
        console.log('Outward document data:', docData);
        
        // Fetch warehouse type from inspections collection with enhanced logic
        let warehouseType = '';
        let warehouseCode = '';
        let warehouseAddress = '';
        let businessType = '';
        
        if (docData.warehouseName) {
          console.log('Looking for warehouse type for warehouse name:', docData.warehouseName);
          try {
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
              
              // Get warehouse type with multiple fallback options
              warehouseType = inspectionData.typeOfWarehouse || 
                            inspectionData.typeofwarehouse || 
                            inspectionData.warehouseType || 
                            inspectionData.warehouseInspectionData?.typeOfWarehouse ||
                            inspectionData.warehouseInspectionData?.warehouseType || '';
              
              // Get other warehouse details
              warehouseCode = inspectionData.warehouseCode || 
                            inspectionData.warehouseInspectionData?.warehouseCode || '';
              warehouseAddress = inspectionData.warehouseAddress || 
                               inspectionData.warehouseInspectionData?.warehouseAddress || '';
              businessType = inspectionData.businessType || 
                           inspectionData.warehouseInspectionData?.businessType || '';
              
              console.log('Extracted warehouse type from inspections:', warehouseType);
            } else {
              console.log('No inspections data found for warehouse:', docData.warehouseName);
            }
          } catch (error) {
            console.log('Error fetching warehouse type from inspections:', error);
          }
        }
        
        // Add additional data processing for commodity/variety if needed
        let commodity = docData.commodity || '';
        let variety = docData.varietyName || docData.variety || '';
        
        // Try to fetch commodity/variety from inward data if missing
        if ((!commodity || !variety) && docData.inwardId) {
          try {
            console.log('Fetching commodity/variety from inward data for inwardId:', docData.inwardId);
            const inwardCollection = collection(db, 'inward');
            const inwardQuery = query(
              inwardCollection,
              where('inwardId', '==', docData.inwardId)
            );
            const inwardSnapshot = await getDocs(inwardQuery);
            
            if (!inwardSnapshot.empty) {
              const inwardData = inwardSnapshot.docs[0].data();
              console.log('Found inward data for commodity/variety:', inwardData);
              
              if (!commodity) commodity = inwardData.commodity || '';
              if (!variety) variety = inwardData.varietyName || inwardData.variety || '';
              
              console.log('Enhanced commodity:', commodity, 'variety:', variety);
            }
          } catch (error) {
            console.log('Error fetching commodity/variety from inward:', error);
          }
        }
        
        return {
          id: doc.id,
          date: docData.createdAt || docData.dateOfOutward || '',
          srNumber: (index + 1).toString(), // Serial number
          outwardId: docData.outwardCode || doc.id,
          inwardId: docData.srwrNo || docData.inwardId || '',
          doNumber: docData.doCode || docData.doNumber || '',
          roNumber: docData.srwrNo || docData.roNumber || '',
          warehouseName: docData.warehouseName || '',
          warehouseType: warehouseType || 'N/A',
          client: docData.client || '',
          commodity: commodity,
          varietyName: variety,
          outwardBags: docData.outwardBags || docData.bags || '',
          outwardQty: docData.outwardQuantity || docData.quantity || '',
          totalValue: docData.totalValue || docData.value || '',
          vehicleNumber: docData.vehicleNumber || '',
          gatepass: docData.gatepass || '',
          status: docData.outwardStatus || docData.status || 'Active',
          // Additional warehouse details
          warehouseCode: warehouseCode,
          warehouseAddress: warehouseAddress,
          typeOfBusiness: businessType,
          ...docData
        };
      }));
      
      console.log('Processed outward data:', data.length, 'records');
      setOutwardData(data);
    } catch (error) {
      console.error('Error fetching outward data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique filter options
  const uniqueWarehouses = useMemo(() => {
    return Array.from(new Set(outwardData.map(item => item.warehouseName).filter(Boolean)));
  }, [outwardData]);

  const uniqueClients = useMemo(() => {
    return Array.from(new Set(outwardData.map(item => item.client).filter(Boolean)));
  }, [outwardData]);

  const uniqueCommodities = useMemo(() => {
    return Array.from(new Set(outwardData.map(item => item.commodity).filter(Boolean)));
  }, [outwardData]);

  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(outwardData.map(item => item.status).filter(Boolean)));
  }, [outwardData]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, warehouseFilter, clientFilter, commodityFilter, itemsPerPage]);

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    let filtered = outwardData;
    
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
      filtered = filtered.filter(item => item.client === clientFilter);
    }

    // Apply commodity filter
    if (commodityFilter && commodityFilter !== 'all') {
      filtered = filtered.filter(item => item.commodity === commodityFilter);
    }
    
    return filtered;
  }, [outwardData, searchTerm, statusFilter, warehouseFilter, clientFilter, commodityFilter]);

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
      'Date', 'SR Number', 'Outward ID', 'Inward ID', 'DO Number', 'RO Number', 
      'Warehouse Name', 'Warehouse Type', 'Warehouse Code', 'Warehouse Address', 'Type of Business',
      'Client', 'Commodity', 'Variety', 'Outward Bags', 'Outward Qty (MT)', 'Total Value', 
      'Vehicle Number', 'Gatepass', 'Status'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => [
        row.date || '',
        row.srNumber || '',
        row.outwardId || '',
        row.inwardId || '',
        row.doNumber || '',
        row.roNumber || '',
        row.warehouseName || '',
        row.warehouseType || '',
        row.warehouseCode || '',
        row.warehouseAddress || '',
        row.typeOfBusiness || '',
        row.client || '',
        row.commodity || '',
        row.varietyName || '',
        row.outwardBags || '',
        row.outwardQty || '',
        row.totalValue || '',
        row.vehicleNumber || '',
        row.gatepass || '',
        row.status || ''
      ].map(value => typeof value === 'string' && value.includes(',') ? `"${value}"` : value).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `outward_report_${startDate}_to_${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setWarehouseFilter('all');
    setClientFilter('all');
    setCommodityFilter('all');
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || warehouseFilter !== 'all' || clientFilter !== 'all' || commodityFilter !== 'all';

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
              Outward Reports
            </h1>
            <p className="text-muted-foreground">Generate and view outward transaction reports</p>
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
                  <div>
                    <Label htmlFor="commodityFilter">Commodity</Label>
                    <Select value={commodityFilter} onValueChange={setCommodityFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Commodities</SelectItem>
                        {uniqueCommodities.map(commodity => (
                          <SelectItem key={commodity} value={commodity}>{commodity}</SelectItem>
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
                    {commodityFilter !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-teal-100 text-teal-800">
                        Commodity: {commodityFilter}
                        <button onClick={() => setCommodityFilter('all')} className="ml-1">
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
            {filteredData.length !== outwardData.length && ` (filtered from ${outwardData.length} total)`}
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
                    {visibleColumns.includes('srNumber') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">SR Number</th>}
                    {visibleColumns.includes('outwardId') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Outward ID</th>}
                    {visibleColumns.includes('inwardId') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Inward ID</th>}
                    {visibleColumns.includes('doNumber') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">DO Number</th>}
                    {visibleColumns.includes('roNumber') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">RO Number</th>}
                    {visibleColumns.includes('warehouseName') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Warehouse Name</th>}
                    {visibleColumns.includes('warehouseType') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Warehouse Type</th>}
                    {visibleColumns.includes('client') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Client</th>}
                    {visibleColumns.includes('commodity') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Commodity</th>}
                    {visibleColumns.includes('varietyName') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Variety</th>}
                    {visibleColumns.includes('outwardBags') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Outward Bags</th>}
                    {visibleColumns.includes('outwardQty') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Outward Qty (MT)</th>}
                    {visibleColumns.includes('totalValue') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Total Value</th>}
                    {visibleColumns.includes('vehicleNumber') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Vehicle Number</th>}
                    {visibleColumns.includes('gatepass') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Gatepass</th>}
                    {visibleColumns.includes('status') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Status</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {visibleColumns.includes('date') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {formatDate(item.date)}
                        </td>
                      )}
                      {visibleColumns.includes('srNumber') && (
                        <td className="border border-gray-200 px-4 py-2 text-center font-mono text-sm">
                          {item.srNumber || 'N/A'}
                        </td>
                      )}
                      {visibleColumns.includes('outwardId') && (
                        <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                          {item.outwardId || 'N/A'}
                        </td>
                      )}
                      {visibleColumns.includes('inwardId') && (
                        <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                          {item.inwardId || 'N/A'}
                        </td>
                      )}
                      {visibleColumns.includes('doNumber') && (
                        <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                          {item.doNumber || 'N/A'}
                        </td>
                      )}
                      {visibleColumns.includes('roNumber') && (
                        <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                          {item.roNumber || 'N/A'}
                        </td>
                      )}
                      {visibleColumns.includes('warehouseName') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.warehouseName || 'N/A'}
                        </td>
                      )}
                      {visibleColumns.includes('warehouseType') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.warehouseType || 'N/A'}
                        </td>
                      )}
                      {visibleColumns.includes('warehouseCode') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.warehouseCode || 'N/A'}
                        </td>
                      )}
                      {visibleColumns.includes('warehouseAddress') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.warehouseAddress || 'N/A'}
                        </td>
                      )}
                      {visibleColumns.includes('typeOfBusiness') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.typeOfBusiness || 'N/A'}
                        </td>
                      )}
                      {visibleColumns.includes('client') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.client || 'N/A'}
                        </td>
                      )}
                      {visibleColumns.includes('commodity') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.commodity || 'N/A'}
                        </td>
                      )}
                      {visibleColumns.includes('varietyName') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.varietyName || 'N/A'}
                        </td>
                      )}
                      {visibleColumns.includes('outwardBags') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {item.outwardBags || 'N/A'}
                        </td>
                      )}
                      {visibleColumns.includes('outwardQty') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {item.outwardQty || 'N/A'}
                        </td>
                      )}
                      {visibleColumns.includes('totalValue') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {item.totalValue || 'N/A'}
                        </td>
                      )}
                      {visibleColumns.includes('vehicleNumber') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.vehicleNumber || 'N/A'}
                        </td>
                      )}
                      {visibleColumns.includes('gatepass') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.gatepass || 'N/A'}
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
                  {loading ? 'Loading data...' : 'No outward data found matching the current filters'}
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
