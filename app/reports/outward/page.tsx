"use client";

import DashboardLayout from '@/components/dashboard-layout';
import { useState, useEffect, useMemo, useCallback } from 'react';
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
  outwardDate: string;
  outwardCode: string;
  srWrNumber: string;
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
  weighbridgeSlipNumber: string;
  grossWeight: string;
  tareWeight: string;
  netWeight: string;
  totalOutwardBags: string;
  stackNumber: string;
  stackOutwardBags: string;
  doCode: string;
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
    'outwardDate', 'outwardCode', 'srWrNumber', 'state', 'branch', 'location', 'typeOfBusiness', 
    'warehouseType', 'warehouseCode', 'warehouseName', 'clientCode', 'clientName', 'commodity', 
    'variety', 'vehicleNumber', 'cadNumber', 'gatepassNumber', 'totalOutwardBags', 'doCode'
  ]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Enhanced column definitions matching parameter specifications
  const allColumns = [
    { key: 'outwardDate', label: 'Outward Date', width: 'w-28' },
    { key: 'outwardCode', label: 'Outward Code', width: 'w-24' },
    { key: 'srWrNumber', label: 'SR/WR Number', width: 'w-24' },
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
    { key: 'vehicleNumber', label: 'Vehicle Number', width: 'w-28' },
    { key: 'cadNumber', label: 'CAD Number', width: 'w-24' },
    { key: 'gatepassNumber', label: 'Gatepass Number', width: 'w-28' },
    { key: 'weighbridgeName', label: 'Weighbridge Name', width: 'w-32' },
    { key: 'weighbridgeSlipNumber', label: 'Weighbridge Slip Number', width: 'w-36' },
    { key: 'grossWeight', label: 'Gross Weight (MT)', width: 'w-32' },
    { key: 'tareWeight', label: 'Tare Weight (MT)', width: 'w-32' },
    { key: 'netWeight', label: 'Net Weight (MT)', width: 'w-32' },
    { key: 'totalOutwardBags', label: 'Total Outward Bags', width: 'w-32' },
    { key: 'stackNumber', label: 'Stack Number', width: 'w-24' },
    { key: 'stackOutwardBags', label: 'Stack Outward Bags', width: 'w-32' },
    { key: 'doCode', label: 'DO Code', width: 'w-24' }
  ];

  const fetchOutwardData = useCallback(async () => {
    console.log('Starting fetchOutwardData...');
    setLoading(true);
    try {
      const outwardCollection = collection(db, 'outwards');
      console.log('Created outward collection reference');
      
      // Build query with date filters - using ascending order for proper date sequence
      let q = query(outwardCollection, orderBy('createdAt', 'asc'), limit(1000));
      console.log('Built query with date filters');
      
      // Apply date filters if dates are set
      if (startDate && endDate) {
        const startTimestamp = Timestamp.fromDate(new Date(startDate));
        const endTimestamp = Timestamp.fromDate(new Date(endDate + 'T23:59:59'));
        
        q = query(
          outwardCollection,
          where('createdAt', '>=', startTimestamp),
          where('createdAt', '<=', endTimestamp),
          orderBy('createdAt', 'asc'),
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
        
        // Initialize inward data variables
        let inwardData: any = {};
        let commodity = '';
        let variety = '';
        let clientCode = '';
        let clientName = '';
        let inwardWarehouseCode = '';
        let inwardWarehouseName = '';
        let inwardWarehouseAddress = '';
        let inwardTypeOfBusiness = '';
        let srWrNumberFromInward = '';
        
        // Fetch comprehensive inward data for the SR/WR number
        const srwrNo = docData.srwrNo || docData.inwardId || docData.receiptNumber || '';
        if (srwrNo) {
          try {
            console.log('Fetching inward data for SR/WR:', srwrNo);
            const inwardCollection = collection(db, 'inward');
            
            // Try multiple search strategies for inward data
            let inwardSnapshot = await getDocs(query(inwardCollection, where('srwrNo', '==', srwrNo)));
            
            if (inwardSnapshot.empty) {
              inwardSnapshot = await getDocs(query(inwardCollection, where('inwardId', '==', srwrNo)));
            }
            
            if (inwardSnapshot.empty && docData.inwardId) {
              inwardSnapshot = await getDocs(query(inwardCollection, where('inwardId', '==', docData.inwardId)));
            }
            
            if (!inwardSnapshot.empty) {
              inwardData = inwardSnapshot.docs[0].data();
              console.log('Found inward data:', inwardData);
              
              // Extract data from inward collection
              commodity = inwardData.commodity || inwardData.commodityName || '';
              variety = inwardData.varietyName || inwardData.variety || '';
              clientCode = inwardData.clientCode || inwardData.clientId || '';
              clientName = inwardData.clientName || inwardData.client || '';
              inwardWarehouseCode = inwardData.warehouseCode || '';
              inwardWarehouseName = inwardData.warehouseName || '';
              inwardWarehouseAddress = inwardData.warehouseAddress || '';
              inwardTypeOfBusiness = inwardData.typeOfBusiness || inwardData.businessType || '';
              
              // SR/WR number from inward section
              srWrNumberFromInward = inwardData.srwrNo || inwardData.receiptNumber || inwardData.inwardId || '';
              
              console.log('Extracted inward data:', {
                commodity, variety, clientCode, clientName,
                warehouseCode: inwardWarehouseCode, warehouseName: inwardWarehouseName
              });
            } else {
              console.log('No inward data found for SR/WR:', srwrNo);
            }
          } catch (error) {
            console.log('Error fetching inward data:', error);
          }
        }
        
        // Format date for consistent ISO display (YYYY-MM-DD)
        const formatDateForISO = (dateValue: any) => {
          if (!dateValue) return '';
          
          if (dateValue?.toDate) {
            return dateValue.toDate().toISOString().split('T')[0]; // Format as YYYY-MM-DD
          }
          
          if (typeof dateValue === 'string') {
            // If already in correct format, return as is
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
              return dateValue;
            }
            const date = new Date(dateValue);
            return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
          }
          
          return '';
        };
        
        return {
          id: doc.id,
          
          // Outward Date – picked from outward section module
          outwardDate: formatDateForISO(docData.createdAt || docData.dateOfOutward || docData.outwardDate),
          
          // Outward code – picked from outward section module with parameter name outward code
          outwardCode: docData.outwardCode || docData.outwardId || doc.id || '',
          
          // SR/WR number – picked from inward section module with parameter name SR number for SR, WR number for WR
          srWrNumber: srWrNumberFromInward || docData.srwrNo || docData.inwardId || '',
          
          // State – picked from outward section for a particular sr/wr number
          state: docData.state || docData.bankState || docData.selectedState || '',
          
          // Branch - picked from outward section for a particular sr/wr number
          branch: docData.branch || docData.bankBranch || docData.branchName || '',
          
          // Location – picked from outward section for a particular sr/wr number
          location: docData.location || docData.warehouseAddress || docData.address || '',
          
          // Type of Business - picked from inward section for a particular sr/wr number
          typeOfBusiness: inwardTypeOfBusiness || docData.typeOfBusiness || docData.businessType || '',
          
          // Warehouse type – picked from warehouse inspection survey form with parameter name \"TYPE OF WAREHOUSE\"
          warehouseType: warehouseType || 'N/A',
          
          // Warehouse code - picked from inward section for a particular sr/wr number
          warehouseCode: inwardWarehouseCode || warehouseCode || docData.warehouseCode || '',
          
          // Warehouse name - picked from inward section for a particular sr/wr number
          warehouseName: inwardWarehouseName || docData.warehouseName || '',
          
          // Warehouse address - picked from inward section for a particular sr/wr number
          warehouseAddress: inwardWarehouseAddress || warehouseAddress || docData.warehouseAddress || '',
          
          // Client code - picked from inward section for a particular sr/wr number
          clientCode: clientCode || docData.clientCode || docData.clientId || '',
          
          // Client name - picked from inward section for a particular sr/wr number
          clientName: clientName || docData.client || docData.clientName || '',
          
          // Commodity - picked from inward section for a particular sr/wr number
          commodity: commodity || docData.commodity || '',
          
          // Variety - picked from inward section for a particular sr/wr number
          variety: variety || docData.varietyName || docData.variety || '',
          
          // Vehicle number - picked from outward section for a particular sr/wr number
          vehicleNumber: docData.vehicleNumber || docData.truckNumber || '',
          
          // CAD number - picked from outward section for a particular sr/wr number
          cadNumber: docData.cadNumber || docData.cad || '',
          
          // Gatepass number - picked from outward section for a particular sr/wr number
          gatepassNumber: docData.gatepassNumber || docData.gatepass || docData.gatePassNumber || '',
          
          // Weighbridge name - picked from outward section for a particular sr/wr number
          weighbridgeName: docData.weighbridgeName || docData.weighBridgeName || '',
          
          // Weighbridge slip number - picked from outward section for a particular sr/wr number
          weighbridgeSlipNumber: docData.weighbridgeSlipNumber || docData.weighBridgeSlipNumber || docData.slipNumber || '',
          
          // Gross Weight (MT) - picked from outward section for a particular sr/wr number
          grossWeight: docData.grossWeight || docData.grossWeightMT || '',
          
          // Tare Weight (MT) - picked from outward section for a particular sr/wr number
          tareWeight: docData.tareWeight || docData.tareWeightMT || '',
          
          // Net Weight (MT) - picked from outward section for a particular sr/wr number
          netWeight: docData.netWeight || docData.netWeightMT || docData.quantity || '',
          
          // Total Outward Bags - picked from outward section for a particular sr/wr number
          totalOutwardBags: docData.totalOutwardBags || docData.outwardBags || docData.bags || docData.totalBags || '',
          
          // Stack Number- picked from outward section for a particular sr/wr number
          stackNumber: docData.stackNumber || docData.stackNo || '',
          
          // Stack Outward Bags- picked from outward section for a particular sr/wr number
          stackOutwardBags: docData.stackOutwardBags || docData.stackBags || '',
          
          // DO code - picked from outward section for a particular sr/wr number
          doCode: docData.doCode || docData.doNumber || docData.deliveryOrderCode || '',
          
          // Keep original fields for backward compatibility and debugging
          _originalData: {
            outwardSection: {
              createdAt: docData.createdAt,
              outwardCode: docData.outwardCode,
              srwrNo: docData.srwrNo,
              state: docData.state,
              branch: docData.branch
            },
            inwardSection: inwardData,
            inspectionSection: {
              warehouseType,
              warehouseCode,
              warehouseAddress,
              businessType
            }
          }
        };
      }));
      
      console.log('Processed outward data:', data.length, 'records');
      console.log('Sample processed data:', data.slice(0, 2));
      setOutwardData(data);
      console.log('Set outward data in state');
    } catch (error) {
      console.error('Error fetching outward data:', error);
    } finally {
      setLoading(false);
      console.log('Finished fetchOutwardData');
    }
  }, [startDate, endDate]);

  // Fetch outward data
  useEffect(() => {
    fetchOutwardData();
  }, [fetchOutwardData]);

  // Set default date range (last 6 months)
  useEffect(() => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(sixMonthsAgo.toISOString().split('T')[0]);
  }, []);

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

    // Apply status filter - Note: status field might not exist in new structure
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Apply warehouse filter using correct field name
    if (warehouseFilter && warehouseFilter !== 'all') {
      filtered = filtered.filter(item => item.warehouseName === warehouseFilter);
    }

    // Apply client filter using correct field name
    if (clientFilter && clientFilter !== 'all') {
      filtered = filtered.filter(item => item.clientName === clientFilter);
    }

    // Apply commodity filter using correct field name
    if (commodityFilter && commodityFilter !== 'all') {
      filtered = filtered.filter(item => item.commodity === commodityFilter);
    }
    
    // Sort by outward date in ascending order (oldest to newest)
    filtered = filtered.sort((a, b) => {
      const dateA: any = a.outwardDate;
      const dateB: any = b.outwardDate;
      
      // Handle string dates (YYYY-MM-DD format)
      if (typeof dateA === 'string' && typeof dateB === 'string') {
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      }
      
      // Handle Firebase Timestamp objects (fallback)
      if (dateA?.toDate && dateB?.toDate) {
        return dateA.toDate().getTime() - dateB.toDate().getTime();
      }
      
      // Handle mixed or invalid dates
      const timeA = typeof dateA === 'string' ? new Date(dateA).getTime() : (dateA?.toDate ? dateA.toDate().getTime() : new Date(dateA || 0).getTime());
      const timeB = typeof dateB === 'string' ? new Date(dateB).getTime() : (dateB?.toDate ? dateB.toDate().getTime() : new Date(dateB || 0).getTime());
      
      return timeA - timeB;
    });
    
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

  // Export filtered data to CSV with complete parameter structure
  const exportToCSV = () => {
    console.log('CSV Export Debug:');
    console.log('- outwardData length:', outwardData.length);
    console.log('- filteredData length:', filteredData.length);
    console.log('- loading state:', loading);
    console.log('- First outwardData item:', outwardData[0]);
    console.log('- First filteredData item:', filteredData[0]);
    
    if (filteredData.length === 0) {
      console.log('No filtered data to export');
      if (outwardData.length > 0) {
        console.log('But outwardData has', outwardData.length, 'items - using that instead');
        // Use outwardData as fallback
        return exportDataArray(outwardData);
      }
      return;
    }
    
    exportDataArray(filteredData);
  };

  const exportDataArray = (dataArray: OutwardReportData[]) => {
    console.log('Exporting data array with', dataArray.length, 'items');
    
    const headers = [
      'Outward Date', 'Outward Code', 'SR/WR Number', 'State', 'Branch', 'Location',
      'Type of Business', 'Warehouse Type', 'Warehouse Code', 'Warehouse Name', 'Warehouse Address',
      'Client Code', 'Client Name', 'Commodity', 'Variety', 'Vehicle Number', 'CAD Number',
      'Gatepass Number', 'Weighbridge Name', 'Weighbridge Slip Number', 'Gross Weight (MT)',
      'Tare Weight (MT)', 'Net Weight (MT)', 'Total Outward Bags', 'Stack Number',
      'Stack Outward Bags', 'DO Code'
    ];
    
    const csvRows = dataArray.map((row, index) => {
      console.log(`Processing row ${index + 1}:`, row.id, row.outwardDate, row.outwardCode);
      return [
        row.outwardDate || '',
        row.outwardCode || '',
        row.srWrNumber || '',
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
        row.weighbridgeSlipNumber || '',
        row.grossWeight || '',
        row.tareWeight || '',
        row.netWeight || '',
        row.totalOutwardBags || '',
        row.stackNumber || '',
        row.stackOutwardBags || '',
        row.doCode || ''
      ].map(value => typeof value === 'string' && value.includes(',') ? `"${value}"` : value).join(',');
    });
    
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    console.log('Final CSV content preview:', csvContent.substring(0, 200) + '...');
    
    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `outward_report_${startDate}_to_${endDate}.csv`;
    document.body.appendChild(a); // Add to DOM for Firefox compatibility
    a.click();
    document.body.removeChild(a); // Clean up
    window.URL.revokeObjectURL(url);
    console.log('CSV file download initiated');
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

        {/* Data Table with Frozen Headers and First Column */}
        <Card>
          <CardContent className="p-0">
            <div className="table-container">
              <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-orange-100 sticky-header">
                  <tr>
                    {visibleColumns.map((colKey, index) => {
                      const column = allColumns.find(col => col.key === colKey);
                      if (!column) return null;
                      
                      const isFirstColumn = index === 0;
                      return (
                        <th 
                          key={column.key}
                          className={`border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold ${
                            isFirstColumn ? 'sticky-first-column header' : ''
                          }`}
                        >
                          {column.label}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {visibleColumns.map((colKey, index) => {
                        const column = allColumns.find(col => col.key === colKey);
                        if (!column) return null;
                        
                        const isFirstColumn = index === 0;
                        const cellValue = item[column.key] || 'N/A';
                        const isNumeric = ['outwardBags', 'outwardQty', 'totalValue'].includes(column.key);
                        const isMonospace = ['outwardId', 'inwardId', 'doNumber', 'roNumber', 'vehicleNumber'].includes(column.key);
                        
                        return (
                          <td
                            key={column.key}
                            className={`border border-gray-200 px-4 py-2 ${
                              isFirstColumn ? 'sticky-first-column' : ''
                            } ${
                              isNumeric ? 'text-right' : ''
                            } ${
                              isMonospace ? 'font-mono text-sm' : ''
                            } ${
                              column.key === 'srNumber' ? 'text-center' : ''
                            }`}
                          >
                            {column.key === 'date' ? formatDate(item.date) : 
                             column.key === 'status' ? (
                               <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                 {item.status || 'Active'}
                               </span>
                             ) : cellValue}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredData.length === 0 && loading && (
                <div className="text-center py-8 text-gray-500">
                  Loading data...
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
