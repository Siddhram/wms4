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
  FileText,
  Download,
  Eye,
  Search,
  X,
  ArrowLeft,
  CheckCircle,
  XCircle,
  RotateCcw
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
  createdAt: string | number | Date | null;
  warehouseInspectionData?: any;
  status?: string;
}

// Define columns for DataTable
const submittedColumns = [
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
      return (
        <span className="text-green-700 w-full flex justify-center">
          {formattedDate || '-'}
        </span>
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
      return (
        <span className="text-green-700 w-full flex justify-center">
          {formattedDate || '-'}
        </span>
      );
    },
    meta: { align: 'center' },
  },
  {
    accessorKey: "remarks",
    header: "Remarks",
    cell: ({ row }: { row: Row<any> }) => {
      const inspection = row.original;
      const remarks = inspection.warehouseInspectionData?.remarks || '';
      return (
        <div className="w-full flex justify-center">
          <div className="max-w-xs truncate" title={remarks}>
            {remarks || '-'}
          </div>
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
      return (
        <div className="flex space-x-2 justify-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const event = new CustomEvent('viewSubmittedDetails', { detail: inspection });
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
              const event = new CustomEvent('activateWarehouse', { detail: inspection });
              document.dispatchEvent(event);
            }}
            className="border-green-300 text-green-600 hover:bg-green-50"
            title="Proceed to Activate"
          >
            <CheckCircle className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const event = new CustomEvent('rejectWarehouse', { detail: inspection });
              document.dispatchEvent(event);
            }}
            className="border-red-300 text-red-600 hover:bg-red-50"
            title="Reject"
          >
            <XCircle className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const event = new CustomEvent('resubmitWarehouse', { detail: inspection });
              document.dispatchEvent(event);
            }}
            className="border-purple-300 text-purple-600 hover:bg-purple-50"
            title="Request Resubmission"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      );
    },
    meta: { align: 'center' },
  },
];

export default function SubmittedWarehousePage() {
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
      
      console.log('Loading submitted inspections, total docs:', querySnapshot.size);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Only include inspections with 'submitted' status
        if (data.status === 'submitted') {
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
      
      console.log('Found submitted inspections:', inspectionData.length);
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
      if (event.detail && event.detail.source !== 'submitted-warehouse') {
        loadInspections();
      }
    };
    
    const handleViewDetails = (event: CustomEvent) => {
      setSelectedInspection(event.detail);
      setShowInspectionForm(true);
    };

    const handleActivateWarehouse = (event: CustomEvent) => {
      // TODO: Implement activation logic with proper validation
      console.log('Activating warehouse:', event.detail);
      toast({
        title: "Feature Coming Soon",
        description: "Warehouse activation with insurance validation will be implemented.",
      });
    };

    const handleRejectWarehouse = (event: CustomEvent) => {
      // TODO: Implement rejection logic with remarks
      console.log('Rejecting warehouse:', event.detail);
      toast({
        title: "Feature Coming Soon",
        description: "Warehouse rejection with remarks will be implemented.",
      });
    };

    const handleResubmitWarehouse = (event: CustomEvent) => {
      // TODO: Implement resubmission logic with remarks
      console.log('Requesting resubmission for warehouse:', event.detail);
      toast({
        title: "Feature Coming Soon",
        description: "Warehouse resubmission request with remarks will be implemented.",
      });
    };
    
    window.addEventListener('inspectionDataUpdated', handleInspectionUpdate as EventListener);
    document.addEventListener('viewSubmittedDetails', handleViewDetails as EventListener);
    document.addEventListener('activateWarehouse', handleActivateWarehouse as EventListener);
    document.addEventListener('rejectWarehouse', handleRejectWarehouse as EventListener);
    document.addEventListener('resubmitWarehouse', handleResubmitWarehouse as EventListener);
    
    return () => {
      window.removeEventListener('inspectionDataUpdated', handleInspectionUpdate as EventListener);
      document.removeEventListener('viewSubmittedDetails', handleViewDetails as EventListener);
      document.removeEventListener('activateWarehouse', handleActivateWarehouse as EventListener);
      document.removeEventListener('rejectWarehouse', handleRejectWarehouse as EventListener);
      document.removeEventListener('resubmitWarehouse', handleResubmitWarehouse as EventListener);
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
        (typeof inspection.businessType === 'string' && inspection.businessType.toLowerCase().includes(searchLower)) ||
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
    Array.from(new Set(
      inspections
        .map(i => (typeof i.businessType === 'string' ? i.businessType : ''))
        .filter(Boolean)
    ))
  , [inspections]);

  // Export to CSV function
  const exportToCSV = () => {
    const dataToExport = filteredAndSortedInspections;
    
    if (dataToExport.length === 0) {
      toast({
        title: "No Data",
        description: "No submitted inspections available to export",
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
      'Remarks'
    ];

    // Sort by inspection code in ascending order
    const sortedData = [...dataToExport].sort((a, b) => a.inspectionCode.localeCompare(b.inspectionCode));
    
    const csvData = sortedData.map(inspection => [
        inspection.inspectionCode,
        inspection.warehouseCode,
        inspection.state,
        inspection.branch,
        inspection.location,
        (typeof inspection.businessType === 'string' ? inspection.businessType.toUpperCase() : ''),
        inspection.warehouseName || '',
        inspection.bankState,
        inspection.bankBranch,
        inspection.bankName,
        inspection.ifscCode,
        inspection.receiptType,
      // Format date to show only date part with type guards
      (typeof inspection.createdAt === 'string' || typeof inspection.createdAt === 'number' || inspection.createdAt instanceof Date)
        ? new Date(inspection.createdAt).toLocaleDateString()
        : '',
      (() => {
        const v = inspection.warehouseInspectionData?.dateOfInspection;
        return (typeof v === 'string' || typeof v === 'number' || v instanceof Date)
          ? new Date(v).toLocaleDateString()
          : '';
      })(),
      (() => {
        const v = inspection.warehouseInspectionData?.oeDate;
        return (typeof v === 'string' || typeof v === 'number' || v instanceof Date)
          ? new Date(v).toLocaleDateString()
          : '';
      })(),
        inspection.warehouseInspectionData?.remarks || ''
    ]);

    // Create CSV content without extra blank rows
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const filename = `submitted_warehouses_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `${dataToExport.length} submitted warehouses exported to CSV`,
    });
  };

  // Handle status change
  const handleStatusChange = () => {
    setShowInspectionForm(false);
    setSelectedInspection(null);
    loadInspections();
    
    // Dispatch event for cross-module reflection
    window.dispatchEvent(new CustomEvent('inspectionDataUpdated', { 
      detail: { source: 'submitted-warehouse', action: 'statusChange' } 
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
              Submitted Warehouses ({inspections.length})
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

        {/* Inspections Table */}
        {loading ? (
          <Card className="border-green-300">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading submitted warehouses...</p>
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
                Submitted Warehouse Inspections
                {hasActiveFilters && (
                  <span className="text-sm font-normal text-green-600 ml-2">
                    (Filtered: {filteredAndSortedInspections.length} of {inspections.length})
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-green-600">
                All submitted warehouse inspection surveys sorted by inspection code in ascending order.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={submittedColumns}
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