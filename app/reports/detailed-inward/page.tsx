"use client";

import DashboardLayout from '@/components/dashboard-layout';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Calendar, Filter, X, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, where, getDoc, doc, Timestamp } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

interface DetailedInwardReportData {
  id: string;
  dateOfInward: string;
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
  vehicleNumber: string;
  cadNumber: string;
  gatepassNumber: string;
  weighbridgeName: string;
  weighbridgeNumber: string;
  stackNumber: string;
  grossWeight: string;
  tareWeight: string;
  netWeight: string;
  bags: string;
  [key: string]: any;
}

export default function DetailedInwardReportsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [clientFilter, setClientFilter] = useState('all');
  const [commodityFilter, setCommodityFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [inwardData, setInwardData] = useState<DetailedInwardReportData[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // 23 columns - matching all parameters from the table
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'dateOfInward', 'state', 'branch', 'location', 'typeOfBusiness', 'warehouseType', 
    'warehouseCode', 'warehouseName', 'warehouseAddress', 'clientCode', 'clientName', 
    'commodity', 'variety', 'vehicleNumber', 'cadNumber', 'gatepassNumber', 
    'weighbridgeName', 'weighbridgeNumber', 'stackNumber', 'grossWeight', 
    'tareWeight', 'netWeight', 'bags'
  ]);

  // Column definitions for 23 columns - matching all parameters from the table
  const allColumns = [
    { key: 'dateOfInward', label: 'Date of Inward', width: 'w-28' },
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
    { key: 'vehicleNumber', label: 'Vehicle Number', width: 'w-28' },
    { key: 'cadNumber', label: 'CAD Number', width: 'w-24' },
    { key: 'gatepassNumber', label: 'Gatepass Number', width: 'w-28' },
    { key: 'weighbridgeName', label: 'Weighbridge Name', width: 'w-28' },
    { key: 'weighbridgeNumber', label: 'Weighbridge Number', width: 'w-32' },
    { key: 'stackNumber', label: 'Stack Number', width: 'w-24' },
    { key: 'grossWeight', label: 'Gross Weight (MT)', width: 'w-32' },
    { key: 'tareWeight', label: 'Tare Weight (MT)', width: 'w-28' },
    { key: 'netWeight', label: 'Net Weight (MT)', width: 'w-28' },
    { key: 'bags', label: 'Bags', width: 'w-20' }
  ];

  // Get all column keys for visibility toggle
  const allColumnKeys = allColumns.map(col => col.key);

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
      // Fetch from inward collection (main dashboard collection)
      const inwardCollection = collection(db, 'inward');
          
          // Build query - try to order by createdAt if available, otherwise get all documents
          let q = query(inwardCollection, limit(1000));
          
          // Apply date filters if dates are set
          if (startDate && endDate) {
            try {
              const startTimestamp = Timestamp.fromDate(new Date(startDate));
              const endTimestamp = Timestamp.fromDate(new Date(endDate + 'T23:59:59'));
              
              q = query(
                inwardCollection,
                where('createdAt', '>=', startTimestamp),
                where('createdAt', '<=', endTimestamp),
                limit(1000)
              );
            } catch (error) {
              console.log('Date filtering not available, fetching all documents');
              q = query(inwardCollection, limit(1000));
            }
          }
          
          const querySnapshot = await getDocs(q);
          console.log('Inward collection query result:', querySnapshot.size, 'documents');
          
          if (querySnapshot.size > 0) {
            console.log('Sample document data:', querySnapshot.docs[0].data());
            console.log('Sample document ID:', querySnapshot.docs[0].id);
            console.log('All document IDs:', querySnapshot.docs.map(doc => doc.id));
            // Process each inward record
            const processedData = await Promise.all(
              querySnapshot.docs.map(async (doc, index) => {
                const docData = doc.data();
                
                // Get warehouse type from warehouse creation survey section for activated warehouses
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
                
                return {
                  id: doc.id,
                  dateOfInward: docData.dateOfInward || '',
                  state: docData.state || '',
                  branch: docData.branch || '',
                  location: docData.location || '',
                  typeOfBusiness: businessType || docData.businessType || '',
                  warehouseType: warehouseType || docData.warehouseType || '',
                  warehouseCode: warehouseCode || docData.warehouseCode || '',
                  warehouseName: docData.warehouseName || '',
                  warehouseAddress: warehouseAddress || docData.warehouseAddress || '',
                  clientCode: docData.clientCode || '',
                  clientName: docData.client || docData.clientName || '',
                  commodity: docData.commodity || '',
                  variety: docData.varietyName || '',
                  vehicleNumber: docData.vehicleNumber || '',
                  cadNumber: docData.cadNumber || '',
                  gatepassNumber: docData.getpassNumber || '',
                  weighbridgeName: docData.weightBridge || '',
                  weighbridgeNumber: docData.weightBridgeSlipNumber || '',
                  stackNumber: docData.stacks && Array.isArray(docData.stacks) 
                    ? docData.stacks.map((s: any) => s.stackNumber).filter(Boolean).join(', ') 
                    : docData.stackNumber || '',
                  grossWeight: docData.grossWeight || '0',
                  tareWeight: docData.tareWeight || '0',
                  netWeight: docData.netWeight || '0',
                  bags: docData.totalBags || '0'
                };
              })
            );
            
            setInwardData(processedData);
            console.log('Total processed inward data:', processedData.length, 'records');
            console.log('Sample processed data:', processedData[0]);
            console.log('All processed data:', processedData);
          } else {
            setInwardData([]);
            console.log('No inward data found');
          }
    } catch (error) {
      console.error('Error fetching inward data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique filter options
  const uniqueClients = useMemo(() => {
    return Array.from(new Set(inwardData.map(item => item.clientName).filter(Boolean)));
  }, [inwardData]);

  const uniqueCommodities = useMemo(() => {
    return Array.from(new Set(inwardData.map(item => item.commodity).filter(Boolean)));
  }, [inwardData]);

  const uniqueStates = useMemo(() => {
    return Array.from(new Set(inwardData.map(item => item.state).filter(Boolean)));
  }, [inwardData]);

  const uniqueBranches = useMemo(() => {
    return Array.from(new Set(inwardData.map(item => item.branch).filter(Boolean)));
  }, [inwardData]);

  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(inwardData.map(item => item.status).filter(Boolean)));
  }, [inwardData]);

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    let filtered = inwardData;
    
    console.log('Filtering data. Total records:', inwardData.length);
    console.log('Search term:', searchTerm);
    console.log('Status filter:', statusFilter);
    console.log('Client filter:', clientFilter);
    console.log('Commodity filter:', commodityFilter);
    console.log('State filter:', stateFilter);
    console.log('Branch filter:', branchFilter);
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      console.log('After search filter:', filtered.length, 'records');
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
      console.log('After status filter:', filtered.length, 'records');
    }



    // Apply client filter
    if (clientFilter && clientFilter !== 'all') {
      filtered = filtered.filter(item => item.clientName === clientFilter);
      console.log('After client filter:', filtered.length, 'records');
    }

    // Apply commodity filter
    if (commodityFilter && commodityFilter !== 'all') {
      filtered = filtered.filter(item => item.commodity === commodityFilter);
      console.log('After commodity filter:', filtered.length, 'records');
    }

    // Apply state filter
    if (stateFilter && stateFilter !== 'all') {
      filtered = filtered.filter(item => item.state === stateFilter);
      console.log('After state filter:', filtered.length, 'records');
    }

    // Apply branch filter
    if (branchFilter && branchFilter !== 'all') {
      filtered = filtered.filter(item => item.branch === branchFilter);
      console.log('After branch filter:', filtered.length, 'records');
    }
    
    console.log('Final filtered data:', filtered.length, 'records');
    return filtered;
  }, [inwardData, searchTerm, statusFilter, clientFilter, commodityFilter, stateFilter, branchFilter]);

  // Export filtered data to CSV
  const exportToCSV = () => {
    if (filteredData.length === 0) return;
    
          const headers = [
        'Date of Inward', 'State', 'Branch', 'Location', 'Type of Business', 'Warehouse Type', 'Warehouse Code', 'Warehouse Name', 'Warehouse Address', 'Client Code', 'Client Name',
        'Commodity', 'Variety', 'Vehicle Number', 'CAD Number', 'Gatepass Number', 'Weighbridge Name', 'Weighbridge Number', 'Stack Number', 'Gross Weight (MT)', 'Tare Weight (MT)', 'Net Weight (MT)', 'Bags'
      ];
    
    const csvContent = [
      headers.join(','),
      ...filteredData.map((row, index) => [
        row.dateOfInward || '',
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
        row.vehicleNumber || '',
        row.cadNumber || '',
        row.gatepassNumber || '',
        row.weighbridgeName || '',
        row.weighbridgeNumber || '',
        row.stackNumber || '',
        row.grossWeight || '',
        row.tareWeight || '',
        row.netWeight || '',
        row.bags || ''
      ].map(value => typeof value === 'string' && value.includes(',') ? `"${value}"` : value).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'detailed_inward_report.csv'; // Changed filename
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');

    setClientFilter('all');
    setCommodityFilter('all');
    setStateFilter('all');
    setBranchFilter('all');
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || clientFilter !== 'all' || commodityFilter !== 'all' || stateFilter !== 'all' || branchFilter !== 'all';

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
  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes('approved') || normalizedStatus.includes('active')) {
      return 'bg-green-100 text-green-800';
    } else if (normalizedStatus.includes('pending')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (normalizedStatus.includes('rejected')) {
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
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center text-lg font-semibold tracking-tight bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
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
              Detailed Inward Report
            </h1>
            <p className="text-muted-foreground">Generate and view inward transaction reports</p>
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
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 pt-4 border-t">
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
                    {statusFilter !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                        Status: {statusFilter}
                        <button onClick={() => setStatusFilter('all')} className="ml-1">
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
                    {commodityFilter !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Commodity: {commodityFilter}
                        <button onClick={() => setCommodityFilter('all')} className="ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {stateFilter !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
                        State: {stateFilter}
                        <button onClick={() => setStateFilter('all')} className="ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {branchFilter !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-pink-100 text-pink-800">
                        Branch: {branchFilter}
                        <button onClick={() => setBranchFilter('all')} className="ml-1">
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
            Showing {filteredData.length} of {inwardData.length} records
            {hasActiveFilters && ` (filtered)`}
            {startDate && endDate && ` | Date Range: ${startDate} to ${endDate}`}
          </div>
          <div className="flex items-center space-x-2">
            {/* Column Visibility Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Columns ({visibleColumns.length}/{allColumns.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
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
            
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} size="sm">
                Clear Filters
              </Button>
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
                    {allColumns.map(column => (
                      <th key={column.key} className={`border border-orange-300 px-4 py-2 text-left ${column.width} text-orange-800 font-semibold`}>
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={23} className="border border-gray-200 px-4 py-8 text-center text-gray-500">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                        {item.dateOfInward || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {item.state || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {item.branch || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {item.location || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {item.typeOfBusiness || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {item.warehouseType || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {item.warehouseCode || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {item.warehouseName || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {item.warehouseAddress || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {item.clientCode || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {item.clientName || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {item.commodity || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {item.variety || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {item.vehicleNumber || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {item.cadNumber || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {item.gatepassNumber || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {item.weighbridgeName || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {item.weighbridgeNumber || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {item.stackNumber || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-right">
                        {item.grossWeight || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-right">
                        {item.tareWeight || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-right">
                        {item.netWeight || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-right">
                        {item.bags || '-'}
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
              
              {filteredData.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  <p>No inward data found matching the current filters</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Export Button */}
        <div className="flex justify-center">
          <Button 
            onClick={exportToCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold"
            disabled={filteredData.length === 0}
          >
            <Download className="w-5 h-5 mr-2" />
            Export Detailed Inward Report
            {hasActiveFilters && ` (${filteredData.length} records)`}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
