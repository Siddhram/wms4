"use client";

import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import {
  RefreshCw,
  Download,
  Eye,
  Search,
  X,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { DataTable } from '@/components/data-table';
import type { Row } from '@tanstack/react-table';
import WarehouseInspectionForm from '../inspection-form';

// Interface for inspection data
interface InspectionData {
  id: string;
  inspectionCode: string;
  warehouseCode: string;
  state: string;
  branch: string;
  location: string;
  businessType: string;
  warehouseStatus: string;
  warehouseName?: string;
  bankState: string;
  bankBranch: string;
  bankName: string;
  ifscCode: string;
  receiptType: string;
  createdAt: string;
  warehouseInspectionData?: any;
  status?: string;
}

// Define columns for DataTable
const reactivateColumns = [
  {
    accessorKey: "inspectionCode",
    header: "Inspection Code",
    cell: ({ row }: { row: Row<any> }) => (
      <span className="font-bold text-orange-800 w-full flex justify-center">
        {row.getValue("inspectionCode")}
      </span>
    ),
    meta: { align: 'center' },
  },
  {
    accessorKey: "warehouseCode",
    header: "Warehouse Code",
    cell: ({ row }: { row: Row<any> }) => (
      <span className="text-green-700 w-full flex justify-center">
        {row.getValue("warehouseCode")}
      </span>
    ),
    meta: { align: 'center' },
  },
  {
    accessorKey: "state",
    header: "State",
    cell: ({ row }: { row: Row<any> }) => (
      <span className="text-green-700 w-full flex justify-center">
        {row.getValue("state")}
      </span>
    ),
    meta: { align: 'center' },
  },
  {
    accessorKey: "branch",
    header: "Branch",
    cell: ({ row }: { row: Row<any> }) => (
      <span className="text-green-700 w-full flex justify-center">
        {row.getValue("branch")}
      </span>
    ),
    meta: { align: 'center' },
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }: { row: Row<any> }) => (
      <span className="text-green-700 w-full flex justify-center">
        {row.getValue("location")}
      </span>
    ),
    meta: { align: 'center' },
  },
  {
    accessorKey: "businessType",
    header: "Business Type",
    cell: ({ row }: { row: Row<any> }) => (
      <span className="text-green-700 w-full flex justify-center">
        {(() => {
          const v = row.getValue("businessType");
          return typeof v === 'string' ? v.toUpperCase() : '-';
        })()}
      </span>
    ),
    meta: { align: 'center' },
  },
  {
    accessorKey: "warehouseName",
    header: "Warehouse Name",
    cell: ({ row }: { row: Row<any> }) => (
      <span className="text-green-700 w-full flex justify-center">
        {row.getValue("warehouseName") || '-'}
      </span>
    ),
    meta: { align: 'center' },
  },
  {
    accessorKey: "bankState",
    header: "Bank State",
    cell: ({ row }: { row: Row<any> }) => (
      <span className="text-green-700 w-full flex justify-center">
        {row.getValue("bankState")}
      </span>
    ),
    meta: { align: 'center' },
  },
  {
    accessorKey: "bankBranch",
    header: "Bank Branch",
    cell: ({ row }: { row: Row<any> }) => (
      <span className="text-green-700 w-full flex justify-center">
        {row.getValue("bankBranch")}
      </span>
    ),
    meta: { align: 'center' },
  },
  {
    accessorKey: "bankName",
    header: "Bank Name",
    cell: ({ row }: { row: Row<any> }) => (
      <span className="text-green-700 w-full flex justify-center">
        {row.getValue("bankName")}
      </span>
    ),
    meta: { align: 'center' },
  },
  {
    accessorKey: "ifscCode",
    header: "IFSC Code",
    cell: ({ row }: { row: Row<any> }) => (
      <span className="text-green-700 w-full flex justify-center">
        {row.getValue("ifscCode")}
      </span>
    ),
    meta: { align: 'center' },
  },
  {
    accessorKey: "receiptType",
    header: "Receipt Type",
    cell: ({ row }: { row: Row<any> }) => (
      <span className="text-green-700 w-full flex justify-center">
        {row.getValue("receiptType")}
      </span>
    ),
    meta: { align: 'center' },
  },
  {
    accessorKey: "createdAt",
    header: "Created Date",
    cell: ({ row }: { row: Row<any> }) => {
      const date = row.getValue("createdAt");
      const formattedDate = (typeof date === 'string' || typeof date === 'number' || date instanceof Date)
        ? new Date(date).toLocaleDateString()
        : '';
      return (
        <span className="text-green-700 w-full flex justify-center">
          {formattedDate}
        </span>
      );
    },
    meta: { align: 'center' },
  },
  {
    accessorKey: "dateOfInspection",
    header: "Date of Inspection",
    cell: ({ row }: { row: Row<any> }) => {
      const inspection = row.original;
      const inspectionDate = inspection.warehouseInspectionData?.dateOfInspection;
      const formattedDate = inspectionDate ? new Date(inspectionDate).toLocaleDateString() : '';
      const hasDate = !!inspectionDate;
      return (
        <div className="w-full flex justify-center items-center space-x-1">
          <span className={`${hasDate ? 'text-green-700' : 'text-red-600'}`}>
            {formattedDate || 'Missing'}
          </span>
          {!hasDate && <AlertCircle className="w-4 h-4 text-red-600" />}
        </div>
      );
    },
    meta: { align: 'center' },
  },
  {
    accessorKey: "oeDate",
    header: "OE Date",
    cell: ({ row }: { row: Row<any> }) => {
      const inspection = row.original;
      const oeDate = inspection.warehouseInspectionData?.oeDate;
      const formattedDate = oeDate ? new Date(oeDate).toLocaleDateString() : '';
      const hasDate = !!oeDate;
      return (
        <div className="w-full flex justify-center items-center space-x-1">
          <span className={`${hasDate ? 'text-green-700' : 'text-red-600'}`}>
            {formattedDate || 'Missing'}
          </span>
          {!hasDate && <AlertCircle className="w-4 h-4 text-red-600" />}
        </div>
      );
    },
    meta: { align: 'center' },
  },
  {
    accessorKey: "insuranceStatus",
    header: "Insurance Status",
    cell: ({ row }: { row: Row<any> }) => {
      const inspection = row.original;
      const insuranceEntries = inspection.warehouseInspectionData?.insuranceEntries || [];
      const hasInsurance = insuranceEntries.length > 0;
      const hasValidInsurance = insuranceEntries.some((entry: any) => 
        entry.insuranceStartDate && entry.insuranceEndDate && entry.insuranceCompany
      );
      
      return (
        <div className="w-full flex justify-center items-center space-x-1">
          {hasValidInsurance ? (
            <span className="text-green-700">Valid</span>
          ) : hasInsurance ? (
            <span className="text-orange-600">Incomplete</span>
          ) : (
            <>
              <span className="text-red-600">Missing</span>
              <AlertCircle className="w-4 h-4 text-red-600" />
            </>
          )}
        </div>
      );
    },
    meta: { align: 'center' },
  },
  {
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }: { row: Row<any> }) => {
      const inspection = row.original;
      const hasRequiredDates = inspection.warehouseInspectionData?.dateOfInspection && 
                              inspection.warehouseInspectionData?.oeDate;
      const insuranceEntries = inspection.warehouseInspectionData?.insuranceEntries || [];
      const hasValidInsurance = insuranceEntries.some((entry: any) => 
        entry.insuranceStartDate && entry.insuranceEndDate && entry.insuranceCompany
      );
      
      return (
        <div className="flex space-x-2 justify-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const event = new CustomEvent('viewReactivateDetails', { detail: inspection });
              document.dispatchEvent(event);
            }}
            className="border-blue-300 text-blue-600 hover:bg-blue-50"
            title="View/Edit Details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const event = new CustomEvent('reactivateWarehouse', { detail: inspection });
              document.dispatchEvent(event);
            }}
            className={`border-teal-300 text-teal-600 hover:bg-teal-50 ${
              (!hasRequiredDates || !hasValidInsurance) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={hasRequiredDates && hasValidInsurance ? "Reactivate Warehouse" : "Complete required fields first"}
            disabled={!hasRequiredDates || !hasValidInsurance}
          >
            <CheckCircle className="w-4 h-4" />
          </Button>
        </div>
      );
    },
    meta: { align: 'center' },
  },
];

export default function ReactivateWarehousePage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [inspections, setInspections] = useState<InspectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<InspectionData | null>(null);
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('');

  // Load inspections data
  const loadInspections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, 'inspections'));
      const inspectionData: InspectionData[] = [];
      
      console.log('Loading reactivate inspections, total docs:', querySnapshot.size);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Only include inspections with 'reactivate' status
        if (data.status === 'reactivate') {
          inspectionData.push({
            id: doc.id,
            inspectionCode: data.inspectionCode || '',
            warehouseCode: data.warehouseCode || '',
            state: data.state || '',
            branch: data.branch || '',
            location: data.location || '',
            businessType: data.businessType || '',
            warehouseStatus: data.warehouseStatus || '',
            warehouseName: data.warehouseName || '',
            bankState: data.bankState || '',
            bankBranch: data.bankBranch || '',
            bankName: data.bankName || '',
            ifscCode: data.ifscCode || '',
            receiptType: data.receiptType || '',
            createdAt: data.createdAt || '',
            warehouseInspectionData: data.warehouseInspectionData || {},
            status: data.status
          });
        }
      });
      
      console.log('Found reactivate inspections:', inspectionData.length);
      setInspections(inspectionData);
    } catch (error) {
      console.error('Error loading inspections:', error);
      setError('Failed to load inspections');
      toast({
        title: "Error",
        description: "Failed to load inspections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load data on component mount
  useEffect(() => {
    loadInspections();
    
    // Add event listeners for actions and cross-module reflection
    const handleInspectionUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.source !== 'reactivate-warehouse') {
        loadInspections();
      }
    };
    
    const handleViewDetails = (event: CustomEvent) => {
      setSelectedInspection(event.detail);
      setShowInspectionForm(true);
    };

    const handleReactivateWarehouse = (event: CustomEvent) => {
      const inspection = event.detail;
      
      // Validate required date fields
      const hasRequiredDates = inspection.warehouseInspectionData?.dateOfInspection && 
                              inspection.warehouseInspectionData?.oeDate;
      
      if (!hasRequiredDates) {
        toast({
          title: "Cannot Reactivate",
          description: "Date of Inspection and OE Date are required before reactivation. Please update the form.",
          variant: "destructive",
        });
        return;
      }

      // Validate insurance details
      const insuranceEntries = inspection.warehouseInspectionData?.insuranceEntries || [];
      const hasValidInsurance = insuranceEntries.some((entry: any) => 
        entry.insuranceStartDate && entry.insuranceEndDate && entry.insuranceCompany
      );

      if (!hasValidInsurance) {
        toast({
          title: "Cannot Reactivate",
          description: "Valid insurance details are required before reactivation. Please add proper insurance information.",
          variant: "destructive",
        });
        return;
      }

      // TODO: Implement proper reactivation logic
      toast({
        title: "Feature Coming Soon",
        description: "Warehouse reactivation functionality will be implemented with proper validation.",
      });
      console.log('Reactivating warehouse:', inspection);
    };
    
    window.addEventListener('inspectionDataUpdated', handleInspectionUpdate as EventListener);
    document.addEventListener('viewReactivateDetails', handleViewDetails as EventListener);
    document.addEventListener('reactivateWarehouse', handleReactivateWarehouse as EventListener);
    
    return () => {
      window.removeEventListener('inspectionDataUpdated', handleInspectionUpdate as EventListener);
      document.removeEventListener('viewReactivateDetails', handleViewDetails as EventListener);
      document.removeEventListener('reactivateWarehouse', handleReactivateWarehouse as EventListener);
    };
  }, [loadInspections, toast]);

  // Filter and sort inspections data
  const filteredAndSortedInspections = useMemo(() => {
    let filtered = [...inspections];
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(inspection => 
        inspection.inspectionCode.toLowerCase().includes(searchLower) ||
        inspection.warehouseCode.toLowerCase().includes(searchLower) ||
        inspection.state.toLowerCase().includes(searchLower) ||
        inspection.branch.toLowerCase().includes(searchLower) ||
        inspection.location.toLowerCase().includes(searchLower) ||
        inspection.businessType.toLowerCase().includes(searchLower) ||
        (inspection.warehouseName && inspection.warehouseName.toLowerCase().includes(searchLower)) ||
        inspection.bankState.toLowerCase().includes(searchLower) ||
        inspection.bankBranch.toLowerCase().includes(searchLower) ||
        inspection.bankName.toLowerCase().includes(searchLower) ||
        inspection.ifscCode.toLowerCase().includes(searchLower) ||
        inspection.receiptType.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply filters
    if (stateFilter) {
      filtered = filtered.filter(inspection => inspection.state === stateFilter);
    }
    if (branchFilter) {
      filtered = filtered.filter(inspection => inspection.branch === branchFilter);
    }
    if (businessTypeFilter) {
      filtered = filtered.filter(inspection => inspection.businessType === businessTypeFilter);
    }
    
    // Sort by inspection code in ascending order
    filtered.sort((a, b) => a.inspectionCode.localeCompare(b.inspectionCode));

    return filtered;
  }, [inspections, searchTerm, stateFilter, branchFilter, businessTypeFilter]);

  // Get unique values for filter dropdowns
  const uniqueStates = useMemo(() => 
    Array.from(new Set(inspections.map(i => i.state).filter(Boolean)))
  , [inspections]);
  
  const uniqueBranches = useMemo(() => 
    Array.from(new Set(inspections.map(i => i.branch).filter(Boolean)))
  , [inspections]);
  
  const uniqueBusinessTypes = useMemo(() => 
    Array.from(new Set(inspections.map(i => i.businessType).filter(Boolean)))
  , [inspections]);

  // Export to CSV function
  const exportToCSV = () => {
    const dataToExport = filteredAndSortedInspections;
    
    if (dataToExport.length === 0) {
      toast({
        title: "No Data",
        description: "No reactivate inspections available to export",
        variant: "destructive",
      });
      return;
    }
    
    const headers = [
      'Inspection Code',
      'Warehouse Code', 
      'State',
      'Branch',
      'Location',
      'Business Type',
      'Warehouse Name',
      'Bank State',
      'Bank Branch',
      'Bank Name',
      'IFSC Code',
      'Receipt Type',
      'Created Date',
      'Date of Inspection',
      'OE Date',
      'Insurance Status',
      'Ready for Reactivation'
    ];

    // Sort by inspection code in ascending order
    const sortedData = [...dataToExport].sort((a, b) => a.inspectionCode.localeCompare(b.inspectionCode));
    
    const csvData = sortedData.map(inspection => {
      const hasRequiredDates = inspection.warehouseInspectionData?.dateOfInspection && 
                              inspection.warehouseInspectionData?.oeDate;
      const insuranceEntries = inspection.warehouseInspectionData?.insuranceEntries || [];
      const hasValidInsurance = insuranceEntries.some((entry: any) => 
        entry.insuranceStartDate && entry.insuranceEndDate && entry.insuranceCompany
      );
      
      let insuranceStatus = 'Missing';
      if (hasValidInsurance) insuranceStatus = 'Valid';
      else if (insuranceEntries.length > 0) insuranceStatus = 'Incomplete';
      
      return [
        inspection.inspectionCode,
        inspection.warehouseCode,
        inspection.state,
        inspection.branch,
        inspection.location,
        inspection.businessType.toUpperCase(),
        inspection.warehouseName || '',
        inspection.bankState,
        inspection.bankBranch,
        inspection.bankName,
        inspection.ifscCode,
        inspection.receiptType,
        // Format date to show only date part
        inspection.createdAt ? new Date(inspection.createdAt).toLocaleDateString() : '',
        inspection.warehouseInspectionData?.dateOfInspection ? 
          new Date(inspection.warehouseInspectionData.dateOfInspection).toLocaleDateString() : 'Missing',
        inspection.warehouseInspectionData?.oeDate ? 
          new Date(inspection.warehouseInspectionData.oeDate).toLocaleDateString() : 'Missing',
        insuranceStatus,
        (hasRequiredDates && hasValidInsurance) ? 'Yes' : 'No'
      ];
    });

    // Create CSV content without extra blank rows
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const filename = `reactivate_warehouses_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `${dataToExport.length} reactivate warehouses exported to CSV`,
    });
  };

  // Handle status change
  const handleStatusChange = () => {
    setShowInspectionForm(false);
    setSelectedInspection(null);
    loadInspections();
    
    // Dispatch event for cross-module reflection
    window.dispatchEvent(new CustomEvent('inspectionDataUpdated', { 
      detail: { source: 'reactivate-warehouse', action: 'statusChange' } 
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setStateFilter('');
    setBranchFilter('');
    setBusinessTypeFilter('');
  };

  const hasActiveFilters = searchTerm || stateFilter || branchFilter || businessTypeFilter;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header with Dashboard Button and Centered Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push('/surveys/warehouse-creation')}
              className="inline-flex items-center text-lg font-semibold tracking-tight bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Warehouse Creation
            </button>
          </div>
          
          {/* Centered Title with Light Orange Background */}
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-orange-600 inline-block border-b-4 border-green-500 pb-2 px-6 py-3 bg-orange-100 rounded-lg">
              Reactivate Warehouses ({inspections.length})
            </h1>
          </div>
          
          {/* Export Button */}
          <div className="flex space-x-2">
            {filteredAndSortedInspections.length > 0 && (
              <Button 
                onClick={exportToCSV}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filter Section */}
        <Card className="border-green-300">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-green-700">Search & Filter</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by inspection code, warehouse code, state, branch, location, business type, warehouse name, bank details..."
                  className="border-green-300 focus:border-green-500 pl-10"
              />
              </div>
              {hasActiveFilters && (
              <Button
                  onClick={clearAllFilters}
                variant="outline"
                size="sm"
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                  <X className="w-4 h-4 mr-1" />
                  Clear All
              </Button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-green-600 font-medium">State</Label>
                <Select value={stateFilter} onValueChange={setStateFilter}>
                    <SelectTrigger className="border-green-300">
                      <SelectValue placeholder="All States" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="">All States</SelectItem>
                      {uniqueStates.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              <div className="space-y-2">
                <Label className="text-green-600 font-medium">Branch</Label>
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                    <SelectTrigger className="border-green-300">
                      <SelectValue placeholder="All Branches" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="">All Branches</SelectItem>
                      {uniqueBranches.map(branch => (
                        <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              <div className="space-y-2">
                <Label className="text-green-600 font-medium">Business Type</Label>
                <Select value={businessTypeFilter} onValueChange={setBusinessTypeFilter}>
                    <SelectTrigger className="border-green-300">
                    <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                      {uniqueBusinessTypes.map(type => (
                        <SelectItem key={type} value={type}>{type.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                </div>

            {/* Entry Count */}
            <div className="text-sm text-green-600">
              {hasActiveFilters ? (
                <span className="font-medium">
                  {filteredAndSortedInspections.length} of {inspections.length} entries found
                  {searchTerm && ` for "${searchTerm}"`}
                </span>
              ) : (
                <span className="font-medium">
                  Total Entries: {inspections.length}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Card className="border-teal-300 bg-teal-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-5 h-5 text-teal-600" />
              <p className="text-teal-700 font-medium">
                Important: These warehouses are pending reactivation. Ensure all required date fields and insurance details are complete before proceeding with reactivation.
              </p>
              </div>
          </CardContent>
        </Card>

        {/* Inspections Table */}
        {loading ? (
          <Card className="border-green-300">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading reactivate warehouses...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-red-300">
            <CardContent className="p-8 text-center text-red-600">
              <p>{error}</p>
              <Button 
                onClick={loadInspections} 
                className="mt-4"
                variant="outline"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-300">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-700">
                Reactivate Warehouse Inspections
                {hasActiveFilters && (
                  <span className="text-sm font-normal text-green-600 ml-2">
                    (Filtered: {filteredAndSortedInspections.length} of {inspections.length})
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-green-600">
                All reactivate warehouse inspection surveys with validation checks sorted by inspection code in ascending order.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={reactivateColumns}
                data={filteredAndSortedInspections}
                wrapperClassName="border-green-300"
                headClassName="bg-orange-100 text-orange-600 font-bold text-center"
                cellClassName="text-green-800 text-center"
                stickyHeader={true}
                stickyFirstColumn={true}
                showGridLines={true}
                isLoading={loading}
                error={error || undefined}
              />
            </CardContent>
          </Card>
        )}

        {/* Inspection Form Dialog */}
        {showInspectionForm && selectedInspection && (
              <WarehouseInspectionForm 
                onClose={() => {
                  setShowInspectionForm(false);
              setSelectedInspection(null);
            }}
            initialData={selectedInspection}
            mode="edit"
            onStatusChange={handleStatusChange}
          />
        )}
      </div>
    </DashboardLayout>
  );
} 