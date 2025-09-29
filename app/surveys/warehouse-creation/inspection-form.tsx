"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Upload, Plus, Trash2, ChevronDown, ChevronRight, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { collection, getDocs, addDoc, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRoleAccess } from '@/hooks/use-role-access';

interface WarehouseInspectionFormProps {
  onClose: () => void;
  initialData?: any;
  mode?: 'create' | 'view' | 'edit';
  onStatusChange?: (warehouseCode: string, newStatus: string) => void;
  // Action handlers for submitted status
  onActivate?: () => Promise<void>;
  onReject?: () => Promise<void>;
  onResubmit?: () => Promise<void>;
  showSubmittedActions?: boolean;
}

interface WarehouseData {
  id: string;
  warehouseCode: string;
  warehouseName: string;
}

interface BankData {
  id: string;
  bankName: string;
  state: string;
  locations: {
    locationName: string;
    branchName: string;
    ifscCode: string;
  }[];
}

interface AssociatedBank {
  bankState: string;
  bankBranch: string;
  bankName: string;
  ifscCode: string;
}

interface CommodityData {
  id: string;
  commodityId: string;
  commodityName: string;
  varieties: {
    varietyId: string;
    varietyName: string;
    locationName: string;
    branchName: string;
    rate: number;
  }[];
}

interface CommodityMultiSelectProps {
  selectedCommodities: CommodityData[];
  onSelectionChange: (commodities: CommodityData[]) => void;
  className?: string;
}

interface ClientData {
  id?: string;
  clientId: string;
  firmName: string;
  authorizedPersonName: string;
  firmType: string;
  companyAddress: string;
  contactNumber: string;
  panNumber: string;
  gstNumber: string;
  aadharNumber?: string;
  email?: string;
  landline?: string;
  alternateNumber?: string;
  panCardImage?: string;
  aadharCardImage?: string;
  documentUrls?: string[];
  createdAt?: string;
}

interface ChamberData {
  id: string;
  length: string;
  breadth: string;
  height: string;
  divisionFactor: string;
  capacity: string;
}

interface InsuranceEntry {
  id: string;
  insuranceTakenBy: string;
  insuranceCommodity: string;
  clientName: string;
  clientAddress: string;
  selectedBankName: string;
  firePolicyCompanyName: string;
  firePolicyNumber: string;
  firePolicyAmount: string;
  firePolicyStartDate: Date | string | null;
  firePolicyEndDate: Date | string | null;
  burglaryPolicyCompanyName: string;
  burglaryPolicyNumber: string;
  burglaryPolicyAmount: string;
  burglaryPolicyStartDate: Date | string | null;
  burglaryPolicyEndDate: Date | string | null;
  createdAt: string;
  remainingFirePolicyAmount: string;
  remainingBurglaryPolicyAmount: string;
  sourceDocumentId?: string; // Document ID from client or Agrogreen collection
  sourceCollection?: string; // 'clients' or 'agrogreen'
  insuranceId?: string; // Unique insurance ID from client or Agrogreen collection
}

// Add index signature to formData type
interface FormDataType {
  // ...all your fields...
  isAddingInsurance?: boolean;
  [key: string]: any;
}

// Add at the top, after imports
function formatDateDDMMYYYY(date: Date | null | undefined): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Add helper function for alert status
function getInsuranceAlertStatus(insurance: any): 'none' | 'expiring' | 'expired' {
  const today = new Date();
  let soonestEnd: Date | null = null;
  [insurance.firePolicyEndDate, insurance.burglaryPolicyEndDate].forEach((date: any) => {
    const d = date instanceof Date ? date : new Date(date);
    if (d instanceof Date && !isNaN(d.getTime())) {
      if (!soonestEnd || d < soonestEnd) soonestEnd = d;
    }
  });
  if (!soonestEnd) return 'none';
  const endDate = soonestEnd as Date;
  const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays <= 10) return 'expiring';
  return 'none';
}

// CommodityMultiSelect Component
function CommodityMultiSelect({ selectedCommodities, onSelectionChange, className }: CommodityMultiSelectProps) {
  const [commodities, setCommodities] = useState<CommodityData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCommodities = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'commodities'));
        const commoditiesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          varieties: doc.data().varieties || []
        })) as CommodityData[];
        setCommodities(commoditiesData);
      } catch (error) {
        console.error('Error loading commodities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCommodities();
  }, []);

  const handleCommodityToggle = (commodity: CommodityData) => {
    const isSelected = selectedCommodities.some(c => c.id === commodity.id);
    if (isSelected) {
      onSelectionChange(selectedCommodities.filter(c => c.id !== commodity.id));
    } else {
      onSelectionChange([...selectedCommodities, commodity]);
    }
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full justify-between ${className}`}
      >
        <span>
          {selectedCommodities.length === 0
            ? "Select commodities..."
            : `${selectedCommodities.length} commodities selected`}
        </span>
        <ChevronDown className="h-4 w-4" />
      </Button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="p-4 text-center">Loading commodities...</div>
          ) : commodities.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No commodities available</div>
          ) : (
            <div className="p-2">
              {commodities.map((commodity) => {
                const isSelected = selectedCommodities.some(c => c.id === commodity.id);
                return (
                  <div
                    key={commodity.id}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 cursor-pointer rounded"
                    onClick={() => handleCommodityToggle(commodity)}
                  >
                    <Checkbox checked={isSelected} />
                    <div className="flex-1">
                      <div className="font-medium text-orange-600">
                        {commodity.commodityName}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {commodity.commodityId}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      
      {selectedCommodities.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {selectedCommodities.map((commodity) => (
            <div
              key={commodity.id}
              className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded-md"
            >
              {commodity.commodityName}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectionChange(selectedCommodities.filter(c => c.id !== commodity.id));
                }}
                className="ml-1 text-orange-600 hover:text-orange-800"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WarehouseInspectionForm({ 
  onClose, 
  initialData, 
  mode = 'create',
  onStatusChange,
  onActivate,
  onReject,
  onResubmit,
  showSubmittedActions = false
}: WarehouseInspectionFormProps) {
  const { toast } = useToast();
  const { 
    userRole, 
    canEditSurvey, 
    canApproveSurvey, 
    showSurveyActions, 
    getSurveyTabMode,
    canEditWarehouseName,
    canAccessInsuranceFunction
  } = useRoleAccess();

  // Helper function to safely convert dates to ISO strings
  const safeDateToISO = (dateValue: any): string | null => {
    if (!dateValue) return null;
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString();
    } catch (error) {
      console.error('Error converting date to ISO:', error);
      return null;
    }
  };

  // Helper function to safely create Date objects
  function safeCreateDate(val: any): Date | null {
    if (!val) return null;
    if (val instanceof Date) return val;
    // Firestore Timestamp object
    if (typeof val === "object" && val.seconds !== undefined) {
      // Firestore Timestamp: has .toDate() method
      if (typeof val.toDate === "function") {
        return val.toDate();
      }
      // Or construct manually
      return new Date(val.seconds * 1000);
    }
    if (typeof val === "string") {
      // Remove everything after the date part
      let dateStr = val.replace(/\u202F/g, " "); // replace narrow no-break space
      const match = dateStr.match(/^([A-Za-z]+ \d{1,2}, \d{4})/);
      if (match) {
        dateStr = match[1];
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d;
      }
      // Try fallback: parse as ISO if possible
      const d2 = new Date(val);
      if (!isNaN(d2.getTime())) return d2;
    }
    return null;
  }

  // Form state
  const [formData, setFormData] = useState<FormDataType>({
    // Basic warehouse details
    warehouseName: '',
    warehouseCode: '',
    inspectionCode: '',
    address: '',
    status: 'pending', // Default status
    showActivationButtons: false,
    typeOfWarehouse: '',
    customWarehouseType: '',
    license: '',
    licenseNumber: '',
    dateOfInspection: null as Date | null,
    
    // Bank details
    bankState: '',
    bankBranch: '',
    bankName: '',
    ifscCode: '',
    
    // Ownership details
    godownOwnership: '',
    nameOfClient: '',
    godownOwnerName: '',
    godownManagedBy: '',
    warehouseLength: '',
    warehouseBreadth: '',
    warehouseHeight: '',
    divisionFactor: '',
    warehouseCapacity: '',
    constructionYear: '',
    totalChambers: '',
    latitude: '',
    longitude: '',
    
    // Physical condition
    flooring: '',
    shutterDoor: '',
    customShutterDoor: '',
    walls: '',
    roof: '',
    plinthHeight: '',
    anyLeakage: '',
    drainageChannels: '',
    electricWiring: '',
    compoundWallAvailability: '',
    typeOfWall: '',
    compoundGate: '',
    numberOfGates: '',
    isWarehouseClean: '',
    waterAvailability: '',
    typeOfAvailability: '',
    
    // Cold storage specific
    typeOfColdStorage: '',
    typeOfCoolingSystem: '',
    typeOfInsulation: '',
    temperatureMaintained: '',
    
    // Insurance - supporting multiple insurance entries
    insuranceEntries: [] as InsuranceEntry[],
    // Legacy single insurance fields (keeping for backward compatibility)
    insuranceTakenBy: '',
    insuranceCommodity: '',
    selectedCommodities: [] as CommodityData[],
    clientName: '',
    clientAddress: '',
    selectedBankName: '',
    firePolicyCompanyName: '',
    firePolicyNumber: '',
    firePolicyAmount: '',
    firePolicyStartDate: null as Date | null,
    firePolicyEndDate: null as Date | null,
    burglaryPolicyCompanyName: '',
    burglaryPolicyNumber: '',
    burglaryPolicyAmount: '',
    burglaryPolicyStartDate: null as Date | null,
    burglaryPolicyEndDate: null as Date | null,
    remainingFirePolicyAmount: '',
    remainingBurglaryPolicyAmount: '',
    insuranceCompany: '',
    insurancePolicyNumber: '',
    assuredSum: '',
    validityOfInsurance: null as Date | null,
    originalVerified: '',
    
    // Security
    securityAvailable: '',
    typeOfSecurity: '',
    securityGuard: '',
    
    // Inside warehouse
    stackingDone: '',
    commodityStored: '',
    dunnageUsed: '',
    numberOfBags: '',
    weightInMT: '',
    stockCountable: '',
    otherBanksCargo: '',
    nameOfBank: [] as string[],
    otherCollateralManager: '',
    nameOfManager: '',
    
    // Plan for stocking
    commodity: '',
    quantity: '',
    
    // Warehouse upkeep
    dividedIntoChambers: '',
    howManyChambers: '',
    usingStackCards: '',
    maintainingRegisters: '',
    fireFightingEquipments: '',
    numberOfExtinguishers: '',
    expiryDate: null as Date | null,
    weighbridgeFacility: '',
    weighbridgeType: '',
    distanceToWeighbridge: '',
    distanceToPoliceStation: '',
    distanceToFireStation: '',
    
    // Other details
    riskOfCargoAffected: '',
    duringMonsoon: '',
    monsoonRisk: '',
    
    // Insurance claim history
    insuranceClaimHistory: '',
    claimRemarks: '',
    
    // Certification
    warehouseFitCertification: false,
    
    // OE details
    nameOfOE: '',
    oeDate: null as Date | null,
    contactNumber: '',
    place: '',
    attachedFiles: [] as string[],
    
    // Remarks
    remarks: '',
    
    // Chambers
    chambers: [] as ChamberData[]
  });

  // Data states
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [banksData, setBanksData] = useState<BankData[]>([]);
  const [clientsData, setClientsData] = useState<ClientData[]>([]);
  const [commoditiesData, setCommoditiesData] = useState<CommodityData[]>([]);
  const [availableBankStates, setAvailableBankStates] = useState<string[]>([]);
  const [availableBankBranches, setAvailableBankBranches] = useState<string[]>([]);
  const [availableBanks, setAvailableBanks] = useState<{name: string, ifsc: string}[]>([]);
  const [insuranceBanks, setInsuranceBanks] = useState<{name: string, ifsc: string}[]>([]);
  const [associatedBanks, setAssociatedBanks] = useState<AssociatedBank[]>([]);
  const [clientInsuranceData, setClientInsuranceData] = useState<any[]>([]);
  const [selectedClientInsurances, setSelectedClientInsurances] = useState<any[]>([]);
  const [additionalInsuranceSections, setAdditionalInsuranceSections] = useState<any[]>([]);
  const [agrogreenInsuranceData, setAgrogreenInsuranceData] = useState<any[]>([]);
  const [warehouseInsuranceData, setWarehouseInsuranceData] = useState<any[]>([]);
  const [selectedInsurancePolicy, setSelectedInsurancePolicy] = useState<string>('');
  const [selectedAgrogreenInsurances, setSelectedAgrogreenInsurances] = useState<any[]>([]);
  const [selectedWarehouseInsurances, setSelectedWarehouseInsurances] = useState<any[]>([]);
  const [additionalInsuranceClientData, setAdditionalInsuranceClientData] = useState<{[key: string]: any[]}>({});
  const [commodityInsuranceData, setCommodityInsuranceData] = useState<any[]>([]);

  // Insurance popup state
  // Removed insurance popup states - using direct validation instead
  
  // Most fields are now editable - only master data fields remain read-only
  const isReadOnly = false; // Remove general read-only restriction
  
  // Determine which specific fields should be read-only (master data only)
  const isViewMode = mode === 'view';
  // Determine if form should be read-only based on role and status
  const isFormReadOnly = getSurveyTabMode(formData.status || 'pending') === 'view';
  
  // Helper function to check if a field should be read-only
  const isFieldReadOnly = (fieldName: string) => {
    // Master data fields that should remain read-only
    const masterDataFields = ['bankState', 'bankBranch', 'bankName', 'ifscCode'];
    
    // Role-based access control
    const currentStatus = formData.status || 'pending';
    const canEditBasedOnRole = canEditSurvey(currentStatus);
    
    // If user can't edit based on role and status, make field read-only
    if (!canEditBasedOnRole) {
      return true;
    }
    
    // Otherwise, only master data fields are read-only
    return masterDataFields.includes(fieldName);
  };
  
  // Custom dropdown states
  const [customWarehouseTypes, setCustomWarehouseTypes] = useState<string[]>([]);
  const [customShutterTypes, setCustomShutterTypes] = useState<string[]>([]);
  
  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Warehouse name editing state
  const [isEditingWarehouseName, setIsEditingWarehouseName] = useState(false);
  const [editableWarehouseName, setEditableWarehouseName] = useState('');
  
  // Section collapse state - all sections expanded by default
  const [collapsedSections, setCollapsedSections] = useState({
    warehouseDetails: false,
    bankDetails: false,
    ownershipDetails: false,
    physicalCondition: false,
    coldStorageDetails: false,
    insuranceDetails: false,
    securityDetails: false,
    insideWarehouse: false,
    planForStocking: false,
    warehouseUpkeep: false,
    otherDetails: false,
    insuranceClaimHistory: false,
    certification: false,
    oeDetails: false,
    attachments: false,
    remarks: false,
    chambers: false
  });
  
  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const fileNames = files.map(file => file.name);
      setSelectedFiles(prev => [...prev, ...files]);
      setFormData(prev => ({ 
        ...prev, 
        attachedFiles: [...prev.attachedFiles, ...fileNames]
      }));
      toast({
        title: "Files Selected",
        description: `${files.length} file(s) selected successfully`,
      });
    }
    // Reset the input value so the same file can be selected again
    e.target.value = '';
  };

  // Wrap loaders to satisfy exhaustive-deps
  const loadWarehouses = useCallback(async () => {
    try {
      // Load from inspections collection to get existing warehouses
      const inspectionsRef = collection(db, 'inspections');
      const snapshot = await getDocs(inspectionsRef);
      const warehouseSet = new Set<string>();
      const warehouseData: WarehouseData[] = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.warehouseName && !warehouseSet.has(data.warehouseName)) {
          warehouseSet.add(data.warehouseName);
          warehouseData.push({
            id: doc.id,
            warehouseName: data.warehouseName,
            warehouseCode: data.warehouseCode || 'WH-0001'
          });
        }
      });
      setWarehouses(warehouseData);
    } catch (error) {
      console.error('Error loading warehouses:', error);
    }
  }, []);

  const loadBanksData = useCallback(async () => {
    try {
      const banksRef = collection(db, 'banks');
      const snapshot = await getDocs(banksRef);
      const banksData: BankData[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BankData[];
      setBanksData(banksData);
    } catch (error) {
      console.error('Error loading banks data:', error);
    }
  }, []);

  const loadClientsData = useCallback(async () => {
    try {
      const clientsRef = collection(db, 'clients');
      const snapshot = await getDocs(clientsRef);
      const clientsData: ClientData[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClientData[];
      setClientsData(clientsData);
    } catch (error) {
      console.error('Error loading clients data:', error);
    }
  }, []);

  const loadCommoditiesData = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'commodities'));
      const commodities = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        varieties: doc.data().varieties || []
      })) as CommodityData[];
      setCommoditiesData(commodities);
    } catch (error) {
      console.error('Error loading commodities:', error);
    }
  }, []);

  const fetchClientInsurances = useCallback(async (clientName: string) => {
    console.log('🔍 WAREHOUSE CREATION: Fetching insurances from Insurance Master');
    console.log('Filters:', {
      clientName,
      warehouseName: formData.warehouseName,
      state: formData.state,
      branch: formData.branch,
      location: formData.location
    });

    const combinedInsurances: any[] = [];

    const normalizeInsurance = (insurance: any, sourceDocumentId: string, sourceCollection: string) => ({
      ...insurance,
      insuranceCommodity: insurance?.insuranceCommodity || insurance?.commodity || insurance?.commodityName || '',
      commodity: insurance?.commodity || insurance?.commodityName || insurance?.insuranceCommodity || '',
      sourceDocumentId,
      sourceCollection,
      // Show original amounts in main fields, remaining amounts in separate fields
      firePolicyAmount: insurance?.firePolicyAmount || '',
      burglaryPolicyAmount: insurance?.burglaryPolicyAmount || '',
      remainingFirePolicyAmount: insurance?.firePolicyRemainingAmount || insurance?.firePolicyAmount || '',
      remainingBurglaryPolicyAmount: insurance?.burglaryPolicyRemainingAmount || insurance?.burglaryPolicyAmount || '',
    });

    try {
      // Primary: Fetch from Insurance Master collection with warehouse and client filters
      let insuranceQuery;
      
      if (formData.warehouseName && formData.state && formData.branch && formData.location) {
        // Complete warehouse information available - use precise filtering
        insuranceQuery = query(
          collection(db, 'insurance'),
          where('warehouseName', '==', formData.warehouseName),
          where('state', '==', formData.state),
          where('branch', '==', formData.branch),
          where('location', '==', formData.location)
        );
        console.log('✅ Using complete warehouse filters for insurance query');
      } else if (formData.warehouseName) {
        // Only warehouse name available
        insuranceQuery = query(
          collection(db, 'insurance'),
          where('warehouseName', '==', formData.warehouseName)
        );
        console.log('✅ Using warehouse name filter for insurance query');
      } else if (clientName) {
        // Fallback to client name if warehouse not available
        insuranceQuery = query(
          collection(db, 'insurance'),
          where('clientName', '==', clientName)
        );
        console.log('✅ Using client name filter for insurance query');
      } else {
        console.log('❌ No valid filters available for insurance query');
        return [];
      }

      const insuranceSnapshot = await getDocs(insuranceQuery);
      console.log('📊 Insurance Master query result:', insuranceSnapshot.docs.length, 'documents found');
      
      insuranceSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`Insurance ${index + 1}:`, {
          warehouseName: data.warehouseName,
          commodityName: data.commodityName,
          clientName: data.clientName,
          firePolicyAmount: data.firePolicyAmount,
          firePolicyRemainingAmount: data.firePolicyRemainingAmount,
          burglaryPolicyAmount: data.burglaryPolicyAmount,
          burglaryPolicyRemainingAmount: data.burglaryPolicyRemainingAmount
        });
      });

      const normalizedInsurances = insuranceSnapshot.docs.map(doc => {
        const normalized = normalizeInsurance(doc.data(), doc.id, 'insurance');
        console.log('🔧 NORMALIZED INSURANCE from master:', {
          original: {
            firePolicyAmount: doc.data().firePolicyAmount,
            firePolicyRemainingAmount: doc.data().firePolicyRemainingAmount,
            burglaryPolicyAmount: doc.data().burglaryPolicyAmount,
            burglaryPolicyRemainingAmount: doc.data().burglaryPolicyRemainingAmount
          },
          normalized: {
            firePolicyAmount: normalized.firePolicyAmount,
            remainingFirePolicyAmount: normalized.remainingFirePolicyAmount,
            burglaryPolicyAmount: normalized.burglaryPolicyAmount,
            remainingBurglaryPolicyAmount: normalized.remainingBurglaryPolicyAmount
          }
        });
        return normalized;
      });
      
      combinedInsurances.push(...normalizedInsurances);

      // Legacy: Also check clients collection for backward compatibility (if needed)
      if (clientName && combinedInsurances.length === 0) {
        console.log('🔄 No insurance found in master, checking clients collection as fallback...');
        const clientQuery = query(collection(db, 'clients'), where('firmName', '==', clientName));
        const clientSnapshot = await getDocs(clientQuery);
        if (!clientSnapshot.empty) {
          const clientDoc = clientSnapshot.docs[0];
          const clientData = clientDoc.data() as any;
          const clientInsurances = clientData.insurances || [];
          combinedInsurances.push(
            ...clientInsurances.map((insurance: any) =>
              normalizeInsurance(insurance, clientDoc.id, 'clients')
            )
          );
          console.log('📊 Fallback: Found', clientInsurances.length, 'insurances in clients collection');
        }
      }

    } catch (error) {
      console.error('❌ Error fetching insurances:', error);
    }

    const uniqueMap = new Map<string, any>();
    combinedInsurances.forEach((insurance, index) => {
      const key =
        insurance.insuranceCode ||
        insurance.firePolicyNumber ||
        `${insurance.sourceCollection}-${insurance.sourceDocumentId || index}` ||
        `${insurance.sourceCollection}-${index}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, insurance);
      }
    });

    const finalInsurances = Array.from(uniqueMap.values());
    console.log('🎯 FINAL INSURANCES being returned:', finalInsurances.map(ins => ({
      firePolicyNumber: ins.firePolicyNumber,
      firePolicyAmount: ins.firePolicyAmount,
      remainingFirePolicyAmount: ins.remainingFirePolicyAmount,
      burglaryPolicyAmount: ins.burglaryPolicyAmount,
      remainingBurglaryPolicyAmount: ins.remainingBurglaryPolicyAmount,
      sourceCollection: ins.sourceCollection
    })));
    
    return finalInsurances;
  }, []);

  // Fetch associated banks for a given warehouse code
  const fetchAssociatedBanks = useCallback(async (warehouseCode: string) => {
    try {
      const inspectionsRef = collection(db, 'inspections');
      const snapshot = await getDocs(inspectionsRef);

      const associatedBanksData: AssociatedBank[] = [];

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.warehouseCode === warehouseCode) {
          associatedBanksData.push({
            bankState: data.bankState || '',
            bankBranch: data.bankBranch || '',
            bankName: data.bankName || '',
            ifscCode: data.ifscCode || '',
          });
        }
      });

      // Deduplicate by bankName + IFSC
      const uniqueBanks = associatedBanksData.filter((bank, index, self) =>
        index === self.findIndex((b) => b.bankName === bank.bankName && b.ifscCode === bank.ifscCode)
      );

      setAssociatedBanks(uniqueBanks);

      if (mode !== 'view' && uniqueBanks.length > 0) {
        const firstBank = uniqueBanks[0];
        setFormData((prev) => ({
          ...prev,
          bankState: firstBank.bankState,
          bankBranch: firstBank.bankBranch,
          bankName: firstBank.bankName,
          ifscCode: firstBank.ifscCode,
        }));
      }
    } catch (error) {
      console.error('Error fetching associated banks:', error);
      toast({ title: 'Error', description: 'Failed to load associated banks', variant: 'destructive' });
    }
  }, [mode, toast]);

  // Load data on component mount
  useEffect(() => {
    loadWarehouses();
    loadBanksData();
    loadClientsData();
    loadCommoditiesData();
  }, [loadWarehouses, loadBanksData, loadClientsData, loadCommoditiesData]);

  // Initialize form with existing data if provided (only once)
  useEffect(() => {
    // Reset collapse state when form is reopened (always run this)
    setCollapsedSections({
      warehouseDetails: false,
      bankDetails: false,
      ownershipDetails: false,
      physicalCondition: false,
      coldStorageDetails: false,
      insuranceDetails: false,
      securityDetails: false,
      insideWarehouse: false,
      planForStocking: false,
      warehouseUpkeep: false,
      otherDetails: false,
      insuranceClaimHistory: false,
      certification: false,
      oeDetails: false,
      attachments: false,
      remarks: false,
      chambers: false
    });

    if (initialData && Object.keys(initialData).length > 0) {
      
      // Handle insurance entries - check multiple locations where they might be stored
      let insuranceEntries = [];
      
      // Check top level first
      if (initialData.insuranceEntries && Array.isArray(initialData.insuranceEntries)) {
        insuranceEntries = initialData.insuranceEntries;
      } 
      // Check inside warehouseInspectionData
      else if (initialData.warehouseInspectionData?.insuranceEntries && Array.isArray(initialData.warehouseInspectionData.insuranceEntries)) {
        insuranceEntries = initialData.warehouseInspectionData.insuranceEntries;
      }
      // Check if warehouseInspectionData itself has the data we need
      else if (initialData.warehouseInspectionData) {
        const inspectionData = initialData.warehouseInspectionData;
        if (inspectionData.insuranceEntries && Array.isArray(inspectionData.insuranceEntries)) {
          insuranceEntries = inspectionData.insuranceEntries;
        }
      }
      
      // Convert date strings back to Date objects for insurance entries
      const processedInsuranceEntries = insuranceEntries.map((entry: any) => ({
        ...entry,
        firePolicyStartDate: safeCreateDate(entry.firePolicyStartDate),
        firePolicyEndDate: safeCreateDate(entry.firePolicyEndDate),
        burglaryPolicyStartDate: safeCreateDate(entry.burglaryPolicyStartDate),
        burglaryPolicyEndDate: safeCreateDate(entry.burglaryPolicyEndDate),
        createdAt: safeCreateDate(entry.createdAt) || new Date()
      }));
      
      // Determine the source of form data - prioritize warehouseInspectionData
      const formDataSource = initialData.warehouseInspectionData && Object.keys(initialData.warehouseInspectionData).length > 0
        ? initialData.warehouseInspectionData
        : initialData;
      
      // Convert date fields properly
      const processedFormData = { ...formDataSource };
      
      // List of date fields that need conversion
      const dateFields = [
        'dateOfInspection', 'oeDate', 'firePolicyStartDate', 'firePolicyEndDate',
        'burglaryPolicyStartDate', 'burglaryPolicyEndDate', 'lastClaimDate'
      ];
      
      // Convert date fields from strings/objects to Date objects
      dateFields.forEach(field => {
        if (processedFormData[field]) {
          processedFormData[field] = safeCreateDate(processedFormData[field]);
        }
      });
      
      setFormData(prev => ({
        ...prev,
        // Use the processed form data with converted dates, BUT exclude insurance amounts (fetch them fresh)
        ...processedFormData,
        // Always preserve core inspection fields from top level
        inspectionCode: initialData.inspectionCode || formDataSource.inspectionCode || prev.inspectionCode,
        warehouseCode: initialData.warehouseCode || formDataSource.warehouseCode || prev.warehouseCode,
        warehouseName: initialData.warehouseName || formDataSource.warehouseName || prev.warehouseName,
        // Bank details are stored at top level of inspection, not in warehouseInspectionData
        bankState: initialData.bankState || formDataSource.bankState || prev.bankState,
        bankBranch: initialData.bankBranch || formDataSource.bankBranch || prev.bankBranch,
        bankName: initialData.bankName || formDataSource.bankName || prev.bankName,
        ifscCode: initialData.ifscCode || formDataSource.ifscCode || prev.ifscCode,
        // Preserve attachedFiles if they exist in current state
        attachedFiles: formDataSource.attachedFiles || initialData.attachedFiles || prev.attachedFiles || [],
        // Handle insurance entries from existing data with proper date conversion
        insuranceEntries: processedInsuranceEntries,
        // Reset insurance amounts - will be fetched fresh from insurance master
        firePolicyAmount: '',
        burglaryPolicyAmount: '',
        remainingFirePolicyAmount: '',
        remainingBurglaryPolicyAmount: '',
      }));
      
      // Restore selected client insurances and additional sections if they exist
      if (formDataSource.selectedClientInsurances && Array.isArray(formDataSource.selectedClientInsurances)) {
        setSelectedClientInsurances(formDataSource.selectedClientInsurances);
      }
      
      if (formDataSource.additionalInsuranceSections && Array.isArray(formDataSource.additionalInsuranceSections)) {
        setAdditionalInsuranceSections(formDataSource.additionalInsuranceSections);
      }
      // Initialize editable warehouse name
      setEditableWarehouseName(initialData.warehouseName || formDataSource.warehouseName || '');
      
      // If in view mode and we have a warehouse name, fetch associated banks
      if (mode === 'view' && initialData.warehouseName && initialData.warehouseCode) {
        fetchAssociatedBanks(initialData.warehouseCode);
      }
    }
  }, [initialData, initialData?.inspectionCode, mode, fetchAssociatedBanks]); // include initialData to satisfy exhaustive-deps

  // Refresh insurance amounts after form initialization
  useEffect(() => {
    const refreshInsuranceAmounts = async () => {
      if (formData.clientName && formData.insuranceTakenBy === 'client' && 
          (formData.firePolicyNumber || formData.burglaryPolicyNumber)) {
        console.log('🔄 Refreshing insurance amounts for initialized form...');
        try {
          const freshInsuranceData = await fetchClientInsurances(formData.clientName);
          
          // Find matching insurance based on policy numbers
          const matchingInsurance = freshInsuranceData.find(ins => 
            ins.firePolicyNumber === formData.firePolicyNumber || 
            ins.burglaryPolicyNumber === formData.burglaryPolicyNumber
          );
          
          if (matchingInsurance) {
            console.log('✅ Found matching insurance with fresh amounts:', matchingInsurance);
            setFormData(prev => ({
              ...prev,
              firePolicyAmount: matchingInsurance.firePolicyAmount || prev.firePolicyAmount,
              burglaryPolicyAmount: matchingInsurance.burglaryPolicyAmount || prev.burglaryPolicyAmount,
              remainingFirePolicyAmount: matchingInsurance.remainingFirePolicyAmount || '',
              remainingBurglaryPolicyAmount: matchingInsurance.remainingBurglaryPolicyAmount || '',
            }));
          }
        } catch (error) {
          console.error('❌ Error refreshing insurance amounts:', error);
        }
      }
    };

    // Run after a short delay to ensure form initialization is complete
    const timeoutId = setTimeout(refreshInsuranceAmounts, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData.clientName, formData.insuranceTakenBy, formData.firePolicyNumber, formData.burglaryPolicyNumber, fetchClientInsurances]);

  // Bank state effect
  useEffect(() => {
    if (banksData.length > 0) {
      const states = Array.from(new Set(banksData.map((bank) => bank.state)));
      setAvailableBankStates(states);
    }
  }, [banksData]);

  // Bank branch effect
  useEffect(() => {
    if (formData.bankState) {
      const banksInState = banksData.filter(bank => bank.state === formData.bankState);
      const branches: string[] = [];
      
      banksInState.forEach(bank => {
        bank.locations.forEach(location => {
          if (location.branchName) branches.push(location.branchName);
        });
      });
      
  setAvailableBankBranches(Array.from(new Set(branches)));
      
      // Don't clear bank data in view mode OR if we have initialData with bank details
      if (mode !== 'view' && !(initialData && initialData.bankBranch)) {
        setFormData(prev => ({ ...prev, bankBranch: '', bankName: '', ifscCode: '' }));
      }
    }
  }, [formData.bankState, banksData, mode, initialData]);

  // Bank name effect
  useEffect(() => {
    if (formData.bankState && formData.bankBranch) {
      const banksInState = banksData.filter(bank => bank.state === formData.bankState);
      const banksInBranch: {name: string, ifsc: string}[] = [];
      
      banksInState.forEach(bank => {
        bank.locations.forEach(location => {
          if (location.branchName === formData.bankBranch) {
            banksInBranch.push({
              name: bank.bankName,
              ifsc: location.ifscCode
            });
          }
        });
      });
      
      setAvailableBanks(banksInBranch);
      
      // Don't clear bank data in view mode OR if we have initialData with bank details
      if (mode !== 'view' && !(initialData && initialData.bankName)) {
        setFormData(prev => ({ ...prev, bankName: '', ifscCode: '' }));
      }
    }
  }, [formData.bankState, formData.bankBranch, banksData, mode, initialData]);

  // Auto-calculate warehouse capacity
  useEffect(() => {
    if (formData.warehouseLength && formData.warehouseBreadth && formData.divisionFactor) {
      const length = parseFloat(formData.warehouseLength);
      const breadth = parseFloat(formData.warehouseBreadth);
      const division = parseFloat(formData.divisionFactor);
      
      if (!isNaN(length) && !isNaN(breadth) && !isNaN(division) && division !== 0) {
        const capacity = ((length * breadth) / division).toFixed(2);
        setFormData(prev => ({ ...prev, warehouseCapacity: capacity }));
      }
    }
  }, [formData.warehouseLength, formData.warehouseBreadth, formData.divisionFactor]);

  // Load insurance banks when needed
  useEffect(() => {
    if (formData.insuranceTakenBy === 'bank') {
      const banksInBranch: {name: string, ifsc: string}[] = [];
      
      banksData.forEach(bank => {
        bank.locations.forEach(location => {
          if (location.branchName && location.ifscCode && location.locationName) {
            banksInBranch.push({
              name: `${location.locationName} - ${location.branchName}`,
              ifsc: location.ifscCode
            });
          }
        });
      });
      
      setInsuranceBanks(banksInBranch);
    }
  }, [formData.insuranceTakenBy, banksData]);

  // Load client insurance data when client is selected or form is initialized
  useEffect(() => {
    const loadClientInsuranceData = async () => {
      if (formData.clientName && formData.insuranceTakenBy === 'client') {
        try {
          console.log('Loading insurance data for client:', formData.clientName);
          const combinedInsurances = await fetchClientInsurances(formData.clientName);
          
          console.log('Combined insurance data found:', combinedInsurances);
          setClientInsuranceData(combinedInsurances);
        } catch (error) {
          console.error('Error loading client insurance data:', error);
          setClientInsuranceData([]);
        }
      } else if (formData.insuranceTakenBy !== 'client') {
        setClientInsuranceData([]);
      }
    };

    loadClientInsuranceData();
  }, [formData.clientName, formData.insuranceTakenBy, fetchClientInsurances]);

  // Load insurance data based on selected commodities
  const loadInsuranceForCommodities = useCallback(async (commodities: CommodityData[]) => {
    if (commodities.length === 0) {
      setCommodityInsuranceData([]);
      return;
    }

    try {
      console.log('Loading insurance for commodities:', commodities.map(c => c.commodityName));
      
      // Get insurance data based on insurance managed by selection
      if (formData.insuranceTakenBy === 'client' && formData.clientName) {
        const clientQuery = query(collection(db, 'clients'), where('firmName', '==', formData.clientName));
        const clientDocs = await getDocs(clientQuery);
        
        if (!clientDocs.empty) {
          const clientData = clientDocs.docs[0].data();
          const insurances = clientData.insurances || [];
          
          // Filter insurances based on selected commodities
          const commodityNames = commodities.map(c => c.commodityName.toLowerCase());
          const filteredInsurances = insurances.filter((insurance: any) => 
            commodityNames.some(name => 
              insurance.commodity && insurance.commodity.toLowerCase().includes(name)
            )
          );
          
          setCommodityInsuranceData(filteredInsurances);
        }
      } else if (formData.insuranceTakenBy === 'agrogreen') {
        const agrogreenQuery = query(collection(db, 'agrogreen-insurance'));
        const agrogreenDocs = await getDocs(agrogreenQuery);
        
        const insurances: any[] = [];
        agrogreenDocs.forEach(doc => {
          const data = doc.data();
          if (data.insurances && Array.isArray(data.insurances)) {
            insurances.push(...data.insurances);
          }
        });
        
        // Filter insurances based on selected commodities
        const commodityNames = commodities.map(c => c.commodityName.toLowerCase());
        const filteredInsurances = insurances.filter((insurance: any) => 
          commodityNames.some(name => 
            insurance.commodity && insurance.commodity.toLowerCase().includes(name)
          )
        );
        
        setCommodityInsuranceData(filteredInsurances);
      }
    } catch (error) {
      console.error('Error loading insurance for commodities:', error);
    }
  }, [formData.insuranceTakenBy, formData.clientName]);

  // Load initial client insurance data when form is opened with existing data
  useEffect(() => {
    const loadInitialClientInsuranceData = async () => {
      if (initialData?.clientName && initialData?.insuranceTakenBy === 'client') {
        try {
          console.log('🔄 Loading initial insurance data for client:', initialData.clientName);
          
          // Use the fetchClientInsurances function which prioritizes insurance master collection
          const insuranceData = await fetchClientInsurances(initialData.clientName);
          console.log('✅ Initial insurance data loaded:', insuranceData.length, 'policies');
          
          if (insuranceData.length > 0) {
            setClientInsuranceData(insuranceData);
            
            // Auto-fill with the first insurance if available (using updated amounts)
            const firstInsurance = insuranceData[0];
            console.log('🔧 Auto-filling initial form with first insurance:', firstInsurance);
            
            setFormData(prev => ({
              ...prev,
              firePolicyCompanyName: firstInsurance.firePolicyCompanyName || '',
              firePolicyNumber: firstInsurance.firePolicyNumber || '',
              firePolicyAmount: firstInsurance.firePolicyAmount || '',
              firePolicyStartDate: safeCreateDate(firstInsurance.firePolicyStartDate),
              firePolicyEndDate: safeCreateDate(firstInsurance.firePolicyEndDate),
              burglaryPolicyCompanyName: firstInsurance.burglaryPolicyCompanyName || '',
              burglaryPolicyNumber: firstInsurance.burglaryPolicyNumber || '',
              burglaryPolicyAmount: firstInsurance.burglaryPolicyAmount || '',
              burglaryPolicyStartDate: safeCreateDate(firstInsurance.burglaryPolicyStartDate),
              burglaryPolicyEndDate: safeCreateDate(firstInsurance.burglaryPolicyEndDate),
              remainingFirePolicyAmount: firstInsurance.remainingFirePolicyAmount || '',
              remainingBurglaryPolicyAmount: firstInsurance.remainingBurglaryPolicyAmount || '',
            }));
          }
        } catch (error) {
          console.error('❌ Error loading initial client insurance data:', error);
        }
      }
    };

    loadInitialClientInsuranceData();
  }, [initialData, fetchClientInsurances]);

  // removed duplicate non-callback loader functions (defined above with useCallback)

  const handleWarehouseSelect = async (warehouseName: string) => {
    const selectedWarehouse = warehouses.find(w => w.warehouseName === warehouseName);
    if (selectedWarehouse) {
      setFormData(prev => ({
        ...prev,
        warehouseName,
        warehouseCode: selectedWarehouse.warehouseCode
      }));

      // Fetch associated banks for this warehouse
      await fetchAssociatedBanks(selectedWarehouse.warehouseCode);
    }
  };


  const handleBankSelect = (bankName: string) => {
    const selectedBank = availableBanks.find(b => b.name === bankName);
    if (selectedBank) {
      setFormData(prev => ({
        ...prev,
        bankName,
        ifscCode: selectedBank.ifsc
      }));
    }
  };

  const addBankName = () => {
    setFormData(prev => ({
      ...prev,
      nameOfBank: [...prev.nameOfBank, '']
    }));
  };

  const removeBankName = (index: number) => {
    setFormData(prev => ({
      ...prev,
      nameOfBank: prev.nameOfBank.filter((_: string, i: number) => i !== index)
    }));
  };

  const updateBankName = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      nameOfBank: prev.nameOfBank.map((name: string, i: number) => (i === index ? value : name))
    }));
  };

  // Chamber management functions
  const addChamber = () => {
    const newChamber: ChamberData = {
      id: Date.now().toString(),
      length: '',
      breadth: '',
      height: '',
      divisionFactor: '',
      capacity: ''
    };
    setFormData(prev => ({
      ...prev,
      chambers: [...prev.chambers, newChamber]
    }));
  };

  const removeChamber = (chamberId: string) => {
    setFormData(prev => ({
      ...prev,
      chambers: prev.chambers.filter((chamber: ChamberData) => chamber.id !== chamberId)
    }));
  };

  const updateChamber = (chamberId: string, field: keyof ChamberData, value: string) => {
    setFormData(prev => ({
      ...prev,
      chambers: prev.chambers.map((chamber: ChamberData) => {
        if (chamber.id === chamberId) {
          const updatedChamber = { ...chamber, [field]: value };
          
          // Calculate capacity if length, breadth, and division factor are provided
          if (field === 'length' || field === 'breadth' || field === 'divisionFactor') {
            const length = parseFloat(field === 'length' ? value : updatedChamber.length);
            const breadth = parseFloat(field === 'breadth' ? value : updatedChamber.breadth);
            const divisionFactor = parseFloat(field === 'divisionFactor' ? value : updatedChamber.divisionFactor);
            
            if (!isNaN(length) && !isNaN(breadth) && !isNaN(divisionFactor) && divisionFactor !== 0) {
              updatedChamber.capacity = ((length * breadth) / divisionFactor).toFixed(2);
            } else {
              updatedChamber.capacity = '';
            }
          }
          
          return updatedChamber;
        }
        return chamber;
      })
    }));
  };

  // Insurance management functions
  const addInsuranceEntry = async () => {
    // Prevent duplicate entries by checking if we're already processing
    if (formData.isAddingInsurance) {
      console.log('Already adding insurance, skipping...');
      return;
    }

    // Set flag to prevent duplicate processing
    setFormData(prev => ({ ...prev, isAddingInsurance: true }));

    try {
      // Check if there are selected client insurances from the main insurance section
      if (selectedClientInsurances.length > 0) {
        // Create multiple insurance entries from selected client insurances
        const newInsuranceEntries: InsuranceEntry[] = selectedClientInsurances.map((insurance, index) => {
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substr(2, 9);
          const newInsuranceId = `insurance_${timestamp}_${randomSuffix}_${index}`;
          return {
            id: newInsuranceId,
            insuranceTakenBy: 'client',
            insuranceCommodity: insurance.commodity || '',
            clientName: formData.clientName,
            clientAddress: formData.clientAddress,
            selectedBankName: '',
            firePolicyCompanyName: insurance.firePolicyCompanyName || '',
            firePolicyNumber: insurance.firePolicyNumber || '',
            firePolicyAmount: insurance.firePolicyAmount || '',
            firePolicyStartDate: safeDateToISO(insurance.firePolicyStartDate),
            firePolicyEndDate: safeDateToISO(insurance.firePolicyEndDate),
            burglaryPolicyCompanyName: insurance.burglaryPolicyCompanyName || '',
            burglaryPolicyNumber: insurance.burglaryPolicyNumber || '',
            burglaryPolicyAmount: insurance.burglaryPolicyAmount || '',
            burglaryPolicyStartDate: safeDateToISO(insurance.burglaryPolicyStartDate),
            burglaryPolicyEndDate: safeDateToISO(insurance.burglaryPolicyEndDate),
            createdAt: new Date().toISOString(),
            remainingFirePolicyAmount: insurance.remainingFirePolicyAmount || '',
            remainingBurglaryPolicyAmount: insurance.remainingBurglaryPolicyAmount || '',
            sourceDocumentId: insurance.sourceDocumentId,
            sourceCollection: insurance.sourceCollection,
            insuranceId: insurance.insuranceId
          };
        });

        // Add all new insurance entries to the form
        setFormData(prev => ({
          ...prev,
          insuranceEntries: [...prev.insuranceEntries, ...newInsuranceEntries]
        }));

        // Clear the selected client insurances after creating the entries
        setSelectedClientInsurances([]);

        toast({
          title: "Multiple Client Insurances Added",
          description: `Added ${selectedClientInsurances.length} client insurance entries from selected policies`,
          variant: "default",
        });

        console.log('Created multiple client insurance entries from selected insurances:', newInsuranceEntries);
      } else if (selectedAgrogreenInsurances.length > 0) {
        // Create multiple insurance entries from selected Agrogreen insurances
        const newInsuranceEntries: InsuranceEntry[] = selectedAgrogreenInsurances.map((insurance, index) => {
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substr(2, 9);
          const newInsuranceId = `insurance_${timestamp}_${randomSuffix}_${index}`;
          return {
            id: newInsuranceId,
            insuranceTakenBy: 'agrogreen',
            insuranceCommodity: insurance.commodity || '',
            clientName: '',
            clientAddress: '',
            selectedBankName: '',
            firePolicyCompanyName: insurance.firePolicyCompanyName || '',
            firePolicyNumber: insurance.firePolicyNumber || '',
            firePolicyAmount: insurance.firePolicyAmount || '',
            firePolicyStartDate: safeDateToISO(insurance.firePolicyStartDate),
            firePolicyEndDate: safeDateToISO(insurance.firePolicyEndDate),
            burglaryPolicyCompanyName: insurance.burglaryPolicyCompanyName || '',
            burglaryPolicyNumber: insurance.burglaryPolicyNumber || '',
            burglaryPolicyAmount: insurance.burglaryPolicyAmount || '',
            burglaryPolicyStartDate: safeDateToISO(insurance.burglaryPolicyStartDate),
            burglaryPolicyEndDate: safeDateToISO(insurance.burglaryPolicyEndDate),
            createdAt: new Date().toISOString(),
            remainingFirePolicyAmount: insurance.remainingFirePolicyAmount || '',
            remainingBurglaryPolicyAmount: insurance.remainingBurglaryPolicyAmount || '',
            sourceDocumentId: insurance.sourceDocumentId,
            sourceCollection: insurance.sourceCollection,
            insuranceId: insurance.insuranceId // <-- use the real insuranceId from agrogreen
          };
        });

        // Add all new insurance entries to the form
        setFormData(prev => ({
          ...prev,
          insuranceEntries: [...prev.insuranceEntries, ...newInsuranceEntries]
        }));

        // Clear the selected Agrogreen insurances after creating the entries
        setSelectedAgrogreenInsurances([]);

        toast({
          title: "Multiple Agrogreen Insurances Added",
          description: `Added ${selectedAgrogreenInsurances.length} Agrogreen insurance entries from selected policies`,
          variant: "default",
        });

        console.log('Created multiple Agrogreen insurance entries from selected insurances:', newInsuranceEntries);
      } else {
        // Create a single empty insurance entry - NO AUTOMATIC POPULATION
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substr(2, 9);
        const newInsuranceId = `insurance_${timestamp}_${randomSuffix}`;
        
    const newInsurance: InsuranceEntry = {
      id: newInsuranceId,
      insuranceId: newInsuranceId,
          insuranceTakenBy: '', // Let user choose
      insuranceCommodity: '',
      clientName: '',
      clientAddress: '',
      selectedBankName: '',
      firePolicyCompanyName: '',
      firePolicyNumber: '',
      firePolicyAmount: '',
      firePolicyStartDate: null,
      firePolicyEndDate: null,
      burglaryPolicyCompanyName: '',
      burglaryPolicyNumber: '',
      burglaryPolicyAmount: '',
      burglaryPolicyStartDate: null,
      burglaryPolicyEndDate: null,
          createdAt: new Date().toISOString(),
          remainingFirePolicyAmount: '',
          remainingBurglaryPolicyAmount: '',
    };

    setFormData(prev => ({
      ...prev,
      insuranceEntries: [...prev.insuranceEntries, newInsurance]
    }));

    toast({
      title: "Insurance Added",
      description: "New empty insurance section added",
      variant: "default",
    });
      }
    } catch (error) {
      console.error('Error adding insurance entry:', error);
      toast({
        title: "Error",
        description: "Failed to add insurance entry",
        variant: "destructive",
      });
    } finally {
      // Clear the flag to allow future additions
      setFormData(prev => ({ ...prev, isAddingInsurance: false }));
    }
  };

  const removeInsuranceEntry = (insuranceId: string) => {
    setFormData(prev => ({
      ...prev,
      insuranceEntries: prev.insuranceEntries.filter((insurance: InsuranceEntry) => insurance.id !== insuranceId)
    }));

    toast({
      title: "Insurance Removed",
      description: "Insurance entry has been removed",
      variant: "default",
    });
  };

  // Function to update warehouse name across all inspections with same warehouse code
  const updateWarehouseNameEverywhere = async (warehouseCode: string, newWarehouseName: string) => {
    try {
      const inspectionsRef = collection(db, 'inspections');
      const q = query(inspectionsRef, where('warehouseCode', '==', warehouseCode));
      const querySnapshot = await getDocs(q);
      
      const updatePromises = querySnapshot.docs.map(async (docSnapshot) => {
        const docRef = doc(db, 'inspections', docSnapshot.id);
        const updateData: any = {
          warehouseName: newWarehouseName,
          lastUpdated: new Date().toISOString()
        };
        
        // Also update nested warehouseInspectionData if it exists
        const data = docSnapshot.data();
        if (data.warehouseInspectionData) {
          updateData.warehouseInspectionData = {
            ...data.warehouseInspectionData,
            warehouseName: newWarehouseName
          };
        }
        
        return updateDoc(docRef, updateData);
      });
      
      await Promise.all(updatePromises);
      
      toast({
        title: "Warehouse Name Updated",
        description: `Updated warehouse name in ${querySnapshot.docs.length} inspection(s)`,
      });
      
      console.log(`Updated warehouse name in ${querySnapshot.docs.length} inspections with warehouse code: ${warehouseCode}`);
    } catch (error) {
      console.error('Error updating warehouse name:', error);
      toast({
        title: "Error",
        description: "Failed to update warehouse name across all inspections",
        variant: "destructive"
      });
    }
  };

  // Handle warehouse name edit
  const handleWarehouseNameEdit = () => {
    setEditableWarehouseName(formData.warehouseName);
    setIsEditingWarehouseName(true);
  };

  // Handle warehouse name save
  const handleWarehouseNameSave = async () => {
    if (editableWarehouseName.trim() && editableWarehouseName !== formData.warehouseName) {
      // Update current form data
      setFormData(prev => ({ ...prev, warehouseName: editableWarehouseName.trim() }));
      
      // Update all inspections with same warehouse code
      if (formData.warehouseCode) {
        await updateWarehouseNameEverywhere(formData.warehouseCode, editableWarehouseName.trim());
      }
    }
    setIsEditingWarehouseName(false);
  };

  // Handle warehouse name cancel
  const handleWarehouseNameCancel = () => {
    setEditableWarehouseName(formData.warehouseName);
    setIsEditingWarehouseName(false);
  };

  // Toggle section collapse
  const toggleSection = (sectionName: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const scrollToField = (fieldName: string) => {
    console.log('🔍 Attempting to scroll to field:', fieldName);
    
    // Create a mapping of field names to user-friendly names and their element IDs
    const fieldMap: { [key: string]: { label: string; elementId: string } } = {
      'warehouseName': { label: 'Warehouse Name', elementId: 'warehouseName' },
      'address': { label: 'Address', elementId: 'address' },
      'typeOfWarehouse': { label: 'Type of Warehouse', elementId: 'typeOfWarehouse' },
      'customWarehouseType': { label: 'Custom Warehouse Type', elementId: 'customWarehouseType' },
      'license': { label: 'License', elementId: 'license' },
      'licenseNumber': { label: 'License Number', elementId: 'licenseNumber' },
      'dateOfInspection': { label: 'Date of Inspection', elementId: 'dateOfInspection' },
      'bankState': { label: 'Bank State', elementId: 'bankState' },
      'bankBranch': { label: 'Bank Branch', elementId: 'bankBranch' },
      'bankName': { label: 'Bank Name', elementId: 'bankName' },
      'ifscCode': { label: 'IFSC Code', elementId: 'ifscCode' },
      'godownOwnership': { label: 'Godown Ownership', elementId: 'godownOwnership' },
      'nameOfClient': { label: 'Name of Client', elementId: 'nameOfClient' },
      'godownOwnerName': { label: 'Godown Owner Name', elementId: 'godownOwnerName' },
      'godownManagedBy': { label: 'Godown Managed By', elementId: 'godownManagedBy' },
      'warehouseLength': { label: 'Warehouse Length', elementId: 'warehouseLength' },
      'warehouseBreadth': { label: 'Warehouse Breadth', elementId: 'warehouseBreadth' },
      'warehouseHeight': { label: 'Warehouse Height', elementId: 'warehouseHeight' },
      'divisionFactor': { label: 'Division Factor', elementId: 'divisionFactor' },
      'constructionYear': { label: 'Construction Year', elementId: 'constructionYear' },
      'totalChambers': { label: 'Total Number of Chambers', elementId: 'totalChambers' },
      'latitude': { label: 'Latitude', elementId: 'latitude' },
      'longitude': { label: 'Longitude', elementId: 'longitude' },
      'flooring': { label: 'Flooring', elementId: 'flooring' },
      'shutterDoor': { label: 'Shutter Door', elementId: 'shutterDoor' },
      'walls': { label: 'Walls', elementId: 'walls' },
      'roof': { label: 'Roof', elementId: 'roof' },
      'plinthHeight': { label: 'Plinth Height', elementId: 'plinthHeight' },
      'anyLeakage': { label: 'Any Leakage', elementId: 'anyLeakage' },
      'drainageChannels': { label: 'Drainage Channels', elementId: 'drainageChannels' },
      'electricWiring': { label: 'Electric Wiring', elementId: 'electricWiring' },
      'compoundWallAvailability': { label: 'Compound Wall Availability', elementId: 'compoundWallAvailability' },
      'compoundGate': { label: 'Compound Gate', elementId: 'compoundGate' },
      'isWarehouseClean': { label: 'Is Warehouse Clean', elementId: 'isWarehouseClean' },
      'waterAvailability': { label: 'Water Availability', elementId: 'waterAvailability' },
      'securityAvailable': { label: 'Security Available', elementId: 'securityAvailable' },
      'stackingDone': { label: 'Stacking Done', elementId: 'stackingDone' },
      'stockCountable': { label: 'Stock Countable', elementId: 'stockCountable' },
      'otherBanksCargo': { label: 'Other Banks Cargo', elementId: 'otherBanksCargo' },
      'otherCollateralManager': { label: 'Other Collateral Manager', elementId: 'otherCollateralManager' },
      'commodity': { label: 'Commodity', elementId: 'commodity' },
      'quantity': { label: 'Quantity', elementId: 'quantity' },
      'dividedIntoChambers': { label: 'Divided Into Chambers', elementId: 'dividedIntoChambers' },
      'usingStackCards': { label: 'Using Stack Cards', elementId: 'usingStackCards' },
      'maintainingRegisters': { label: 'Maintaining Registers', elementId: 'maintainingRegisters' },
      'fireFightingEquipments': { label: 'Fire Fighting Equipments', elementId: 'fireFightingEquipments' },
      'weighbridgeFacility': { label: 'Weighbridge Facility', elementId: 'weighbridgeFacility' },
      'distanceToPoliceStation': { label: 'Distance to Police Station', elementId: 'distanceToPoliceStation' },
      'distanceToFireStation': { label: 'Distance to Fire Station', elementId: 'distanceToFireStation' },
      'riskOfCargoAffected': { label: 'Risk of Cargo Affected', elementId: 'riskOfCargoAffected' },
      'duringMonsoon': { label: 'During Monsoon', elementId: 'duringMonsoon' },
      'insuranceClaimHistory': { label: 'Insurance Claim History', elementId: 'insuranceClaimHistory' },
      'nameOfOE': { label: 'Name of Operational Executive', elementId: 'nameOfOE' },
      'oeDate': { label: 'OE Date', elementId: 'oeDate' },
      'contactNumber': { label: 'Contact Number', elementId: 'contactNumber' },
      'place': { label: 'Place', elementId: 'place' },
      'typeOfColdStorage': { label: 'Type of Cold Storage', elementId: 'typeOfColdStorage' },
      'typeOfCoolingSystem': { label: 'Type of Cooling System', elementId: 'typeOfCoolingSystem' },
      'typeOfInsulation': { label: 'Type of Insulation', elementId: 'typeOfInsulation' },
      'temperatureMaintained': { label: 'Temperature Maintained', elementId: 'temperatureMaintained' },
      'warehouseFitCertification': { label: 'Warehouse Fit Certification', elementId: 'warehouseFitCertification' },
    };

    // Handle chamber fields
    if (fieldName.startsWith('chamber_')) {
      const chamberIndex = fieldName.split('_')[1];
      const element = document.getElementById(`chamber_${chamberIndex}_length`);
      console.log('🔍 Looking for chamber element:', `chamber_${chamberIndex}_length`, 'Found:', !!element);
      if (element) {
        console.log('✅ Scrolling to chamber element');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
        return `Chamber ${parseInt(chamberIndex) + 1} details`;
      }
      return `Chamber ${parseInt(chamberIndex) + 1} details`;
    }

    // Get the field info and scroll to it
    const fieldInfo = fieldMap[fieldName];
    if (fieldInfo) {
      console.log('🔍 Looking for element with ID:', fieldInfo.elementId);
      const element = document.getElementById(fieldInfo.elementId);
      console.log('🔍 Element found:', !!element, element ? element.tagName : 'null');
      
      if (element) {
        console.log('✅ Scrolling to element:', fieldInfo.elementId);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus on the element if it's an input/select
        if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
          setTimeout(() => {
            console.log('🎯 Focusing element:', fieldInfo.elementId);
            element.focus();
          }, 500);
        }
        return fieldInfo.label;
      } else {
        console.log('❌ Element not found, trying alternative selectors...');
        // Try alternative selectors if direct ID doesn't work
        const alternativeSelectors = [
          `input[name="${fieldName}"]`,
          `select[name="${fieldName}"]`,
          `textarea[name="${fieldName}"]`,
          `[data-field="${fieldName}"]`,
          `label[for="${fieldName}"]`
        ];
        
        for (const selector of alternativeSelectors) {
          const altElement = document.querySelector(selector);
          console.log('🔍 Trying selector:', selector, 'Found:', !!altElement);
          if (altElement) {
            console.log('✅ Found element with alternative selector:', selector);
            altElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (altElement.tagName === 'INPUT' || altElement.tagName === 'SELECT' || altElement.tagName === 'TEXTAREA') {
              setTimeout(() => {
                console.log('🎯 Focusing alternative element:', selector);
                (altElement as HTMLElement).focus();
              }, 500);
            }
            return fieldInfo.label;
          }
        }
      }
      
      return fieldInfo.label;
    }

    console.log('❌ No mapping found for field:', fieldName);
    // Fallback: convert camelCase to readable format
    return fieldName.replace(/([A-Z])/g, ' $1').toLowerCase();
  };

  const validateForm = () => {
    const baseRequiredFields = [
      'warehouseName', 'address', 'typeOfWarehouse', 'license', 'dateOfInspection',
      'godownOwnership', 'nameOfClient', 'godownOwnerName', 'godownManagedBy', 
      'warehouseLength', 'warehouseBreadth', 'warehouseHeight', 'divisionFactor', 
      'constructionYear', 'totalChambers', 'latitude', 'longitude', 'flooring', 
      'shutterDoor', 'walls', 'roof', 'plinthHeight', 'anyLeakage', 
      'drainageChannels', 'electricWiring', 'compoundWallAvailability', 
      'compoundGate', 'isWarehouseClean', 'waterAvailability',
      'securityAvailable', 'stackingDone', 'stockCountable',
      'otherBanksCargo', 'otherCollateralManager', 'commodity', 'quantity',
      'dividedIntoChambers', 'usingStackCards', 'maintainingRegisters',
      'fireFightingEquipments', 'weighbridgeFacility', 'distanceToPoliceStation',
      'distanceToFireStation', 'riskOfCargoAffected', 'duringMonsoon',
      'insuranceClaimHistory', 'nameOfOE', 'oeDate', 'contactNumber', 'place'
    ];

    // Insurance fields are no longer mandatory - can be added later
    const requiredFields = [...baseRequiredFields];

    const missingFields: string[] = [];
    const missingFieldsRaw: string[] = [];

    requiredFields.forEach(field => {
      if (!formData[field as keyof typeof formData]) {
        missingFieldsRaw.push(field);
        missingFields.push(field.replace(/([A-Z])/g, ' $1').toLowerCase());
      }
    });

    // Validate contact number is exactly 10 digits
    if (formData.contactNumber && formData.contactNumber.length !== 10) {
      missingFields.push('contact number must be exactly 10 digits');
    }

    // Check conditional fields
    if (formData.typeOfWarehouse === 'others' && !formData.customWarehouseType) {
      missingFieldsRaw.push('customWarehouseType');
      missingFields.push('custom warehouse type');
    }
    if (formData.license === 'yes' && !formData.licenseNumber) {
      missingFieldsRaw.push('licenseNumber');
      missingFields.push('license number');
    }
    if (formData.typeOfWarehouse === 'cold storage') {
      if (!formData.typeOfColdStorage) {
        missingFieldsRaw.push('typeOfColdStorage');
        missingFields.push('type of cold storage');
      }
      if (!formData.typeOfCoolingSystem) {
        missingFieldsRaw.push('typeOfCoolingSystem');
        missingFields.push('type of cooling system');
      }
      if (!formData.typeOfInsulation) {
        missingFieldsRaw.push('typeOfInsulation');
        missingFields.push('type of insulation');
      }
      if (!formData.temperatureMaintained) {
        missingFieldsRaw.push('temperatureMaintained');
        missingFields.push('temperature maintained');
      }
    }

    // Special validation for CM type warehouses - must have bank details
    if (formData.typeOfWarehouse === 'CM' || formData.typeOfWarehouse === 'cm' || formData.customWarehouseType?.toLowerCase() === 'cm') {
      if (!formData.bankState) {
        missingFieldsRaw.push('bankState');
        missingFields.push('bank state');
      }
      if (!formData.bankBranch) {
        missingFieldsRaw.push('bankBranch');
        missingFields.push('bank branch');
      }
      if (!formData.bankName) {
        missingFieldsRaw.push('bankName');
        missingFields.push('bank name');
      }
      if (!formData.ifscCode) {
        missingFieldsRaw.push('ifscCode');
        missingFields.push('IFSC code');
      }
    }

    if (!formData.warehouseFitCertification) {
      missingFieldsRaw.push('warehouseFitCertification');
      missingFields.push('warehouse fit certification');
    }

    // If there are missing fields, scroll to the first one and get its user-friendly name
    if (missingFieldsRaw.length > 0) {
      const firstMissingField = missingFieldsRaw[0];
      const friendlyName = scrollToField(firstMissingField);
      // Replace the first item in missingFields with the user-friendly name from scrollToField
      if (missingFields.length > 0) {
        missingFields[0] = friendlyName;
      }
    }

    return missingFields;
  };

  // Save/Update function that can be called to sync changes
  const saveFormData = async (updateStatus = false, newStatus = formData.status) => {
    try {
      // Clean the form data to avoid invalid date issues
      const cleanFormData = { ...formData };
      
      // Fix any invalid dates in main form data
      Object.keys(cleanFormData).forEach(key => {
        const value = (cleanFormData as any)[key];
        if (value instanceof Date) {
          if (isNaN(value.getTime())) {
            (cleanFormData as any)[key] = null; // Replace invalid dates with null
          } else {
            (cleanFormData as any)[key] = value.toISOString(); // Convert valid dates to ISO string
          }
        }
      });

      // Clean dates in insurance entries
      if (cleanFormData.insuranceEntries && Array.isArray(cleanFormData.insuranceEntries)) {
        cleanFormData.insuranceEntries = cleanFormData.insuranceEntries.map((entry: any) => {
          const cleanedEntry = { ...entry };
          // Clean insurance entry dates
          ['firePolicyStartDate', 'firePolicyEndDate', 'burglaryPolicyStartDate', 'burglaryPolicyEndDate', 'createdAt'].forEach(dateField => {
            const dateValue = cleanedEntry[dateField];
            if (dateValue === null || dateValue === undefined || dateValue === '') {
              cleanedEntry[dateField] = null;
            } else if (dateValue instanceof Date) {
              if (isNaN(dateValue.getTime())) {
                cleanedEntry[dateField] = null;
              } else {
                cleanedEntry[dateField] = dateValue.toISOString();
              }
            } else if (typeof dateValue === 'string') {
              const parsedDate = new Date(dateValue);
              if (isNaN(parsedDate.getTime())) {
                cleanedEntry[dateField] = null;
              } else {
                cleanedEntry[dateField] = parsedDate.toISOString();
              }
            } else {
              cleanedEntry[dateField] = null;
            }
          });
          // Ensure all fields are present and valid
          const insuranceEntryFields = [
            'id',
            'insuranceTakenBy',
            'insuranceCommodity',
            'clientName',
            'clientAddress',
            'selectedBankName',
            'firePolicyCompanyName',
            'firePolicyNumber',
            'firePolicyAmount',
            'firePolicyStartDate',
            'firePolicyEndDate',
            'burglaryPolicyCompanyName',
            'burglaryPolicyNumber',
            'burglaryPolicyAmount',
            'burglaryPolicyStartDate',
            'burglaryPolicyEndDate',
            'createdAt',
            'remainingFirePolicyAmount',
            'remainingBurglaryPolicyAmount'
          ];
          insuranceEntryFields.forEach(field => {
            let value = cleanedEntry[field];
            if (typeof value === 'undefined' || (typeof value === 'number' && isNaN(value))) {
              value = '';
            }
            cleanedEntry[field] = value ?? '';
          });
          return cleanedEntry;
        });
      }

      // Create insurance entries array - ONLY include explicitly added insurance entries
      let allInsuranceEntries = [...(formData.insuranceEntries || [])];
      
      // REMOVED: Automatic creation of main insurance entry from form data
      // Only insurance entries that were explicitly added via "Add Insurance" button should be saved
      // This prevents automatic addition of insurance data when user hasn't selected anything

      const updateData = {
        ...cleanFormData,
        status: newStatus,
        lastUpdated: new Date().toISOString(),
        insuranceEntries: allInsuranceEntries,
        ...(updateStatus && { [`${newStatus}At`]: new Date().toISOString() })
      };

      // Update the inspection record in the inspections collection
      if (formData.inspectionCode) {
        const inspectionsRef = collection(db, 'inspections');
        const q = query(inspectionsRef, where('inspectionCode', '==', formData.inspectionCode));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const docRef = doc(db, 'inspections', querySnapshot.docs[0].id);
          
          console.log('Saving insurance entries:', formData.insuranceEntries); // Debug log
          
          // Debug log the insurance entries before cleaning
          console.log('Raw insurance entries before cleaning:', JSON.stringify(formData.insuranceEntries, null, 2));
          
          await updateDoc(docRef, {
            // Update all editable fields
            inspectionCode: formData.inspectionCode,
            warehouseCode: formData.warehouseCode,
            warehouseName: formData.warehouseName,
            status: newStatus,
            lastUpdated: new Date().toISOString(),
            warehouseInspectionData: updateData,
            // Explicitly include insurance entries at top level too
            insuranceEntries: allInsuranceEntries,
            ...(updateStatus && { [`${newStatus}At`]: new Date().toISOString() })
          });

          return true; // Success
        } else {
          // Document not found - throw error instead of returning false
          throw new Error(`No inspection record found with inspection code: ${formData.inspectionCode}`);
        }
      } else {
        // No inspection code - throw error instead of returning false
        throw new Error('No inspection code available. Please submit the form first to create an inspection record.');
      }
    } catch (error) {
      console.error('Error saving form data:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if form is in view mode for non-pending status
    if (isViewMode && formData.status !== 'pending') {
      return;
    }
    
    const missingFields = validateForm();
    if (missingFields.length > 0) {
      // Give the scroll animation time to complete before showing toast
      setTimeout(() => {
        toast({
          title: "Missing Required Fields",
          description: `Please complete the highlighted field: ${missingFields[0]}${missingFields.length > 1 ? ` and ${missingFields.length - 1} other field(s)` : ''}`,
          variant: "destructive",
        });
      }, 300);
      return;
    }

    try {
      // When submitting, update the existing inspection record's status
      const submissionData = {
        ...formData,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        submittedDate: format(new Date(), 'yyyy-MM-dd'),
        lastUpdated: new Date().toISOString(),
        selectedClientInsurances: selectedClientInsurances,
        additionalInsuranceSections: additionalInsuranceSections
      };

      // Update the existing inspection record in the inspections collection
      if (formData.inspectionCode) {
        // Find the inspection document by inspectionCode
        const inspectionsRef = collection(db, 'inspections');
        const q = query(inspectionsRef, where('inspectionCode', '==', formData.inspectionCode));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // Update the existing inspection record with all changed fields
          const docRef = doc(db, 'inspections', querySnapshot.docs[0].id);
          await updateDoc(docRef, {
            // Update all editable fields from the form
            inspectionCode: formData.inspectionCode,
            warehouseCode: formData.warehouseCode,
            warehouseName: formData.warehouseName,
            status: 'submitted',
            warehouseInspectionData: submissionData,
            submittedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          });
        }
      } else {
        // Create new inspection record if no inspectionCode exists
        await addDoc(collection(db, 'inspections'), {
          ...submissionData,
          inspectionCode: `INS-${Date.now()}`,
          createdAt: new Date().toISOString()
        });
      }

      // Update status in inspection creation table
      if (onStatusChange && formData.warehouseCode) {
        onStatusChange(formData.warehouseCode, 'submitted');
      }

      toast({
        title: "Success",
        description: "Warehouse inspection form submitted successfully",
      });

      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to submit form. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Validate insurance fields for activation
  const validateInsuranceForActivation = () => {
    const missingInsuranceFields: string[] = [];

    // Insurance Taken By is required for activation
    if (!formData.insuranceTakenBy) {
      missingInsuranceFields.push('Insurance Taken By');
    }

    // If insurance is taken by someone other than bank, validate policy details
    if (formData.insuranceTakenBy && formData.insuranceTakenBy !== 'bank') {
      // Fire policy validation
      if (!formData.firePolicyCompanyName) missingInsuranceFields.push('Fire Policy Company Name');
      if (!formData.firePolicyNumber) missingInsuranceFields.push('Fire Policy Number');
      if (!formData.firePolicyAmount) missingInsuranceFields.push('Fire Policy Amount');
      if (!formData.firePolicyStartDate) missingInsuranceFields.push('Fire Policy Start Date');
      if (!formData.firePolicyEndDate) missingInsuranceFields.push('Fire Policy End Date');

      // Burglary policy validation
      if (!formData.burglaryPolicyCompanyName) missingInsuranceFields.push('Burglary Policy Company Name');
      if (!formData.burglaryPolicyNumber) missingInsuranceFields.push('Burglary Policy Number');
      if (!formData.burglaryPolicyAmount) missingInsuranceFields.push('Burglary Policy Amount');
      if (!formData.burglaryPolicyStartDate) missingInsuranceFields.push('Burglary Policy Start Date');
      if (!formData.burglaryPolicyEndDate) missingInsuranceFields.push('Burglary Policy End Date');

      // Client specific validation
      if (formData.insuranceTakenBy === 'client') {
        if (!formData.clientName) missingInsuranceFields.push('Client Name');
        if (!formData.clientAddress) missingInsuranceFields.push('Client Address');
      }

      // Bank specific validation
      if (formData.insuranceTakenBy === 'bank' && !formData.selectedBankName) {
        missingInsuranceFields.push('Bank Name');
      }
    }

    return missingInsuranceFields;
  };

  // Removed handleInsuranceSave - using direct validation instead

  // Removed executeStatusAction - using direct handling in handleStatusAction instead  // Handle status change actions
  const handleStatusAction = async (action: 'edit' | 'activate' | 'resubmit' | 'reject' | 'close' | 'reactivate' | 'submit') => {
    try {
      // For activate and reactivate actions, validate insurance first
      if (action === 'activate' || action === 'reactivate') {
        const missingInsuranceFields = validateInsuranceForActivation();
        if (missingInsuranceFields.length > 0) {
          toast({
            title: `Cannot ${action === 'activate' ? 'Activate' : 'Reactivate'} Warehouse`,
            description: `Missing insurance details: ${missingInsuranceFields.join(', ')}. Please complete the Insurance of Stock section.`,
            variant: "destructive",
          });
          return;
        }
      }

      // For other actions, proceed normally
      let newStatus = '';
      let actionMessage = '';

      switch (action) {
        case 'edit':
          newStatus = 'pending';
          actionMessage = 'Moved to pending for editing';
          break;
        case 'activate':
          newStatus = 'activated';
          actionMessage = 'Activated successfully';
          break;
        case 'resubmit':
          newStatus = 'resubmitted';
          actionMessage = 'Moved to resubmitted';
          break;
        case 'reject':
          newStatus = 'rejected';
          actionMessage = 'Rejected';
          break;
        case 'close':
          newStatus = 'closed';
          actionMessage = 'Closed successfully';
          break;
        case 'reactivate':
          newStatus = 'reactivate';
          actionMessage = 'Moved to Reactivate tab';
          break;
        case 'submit':
          newStatus = 'submitted';
          actionMessage = 'Resubmitted successfully';
          break;
      }

      // Update the status in Firebase
      
      let documentFound = false;
      
              // First try with inspectionCode if available
        if (formData.inspectionCode) {
          const inspectionsRef = collection(db, 'inspections');
          const q = query(inspectionsRef, where('inspectionCode', '==', formData.inspectionCode));
          const querySnapshot = await getDocs(q);
        
                  if (!querySnapshot.empty) {
            const docRef = doc(db, 'inspections', querySnapshot.docs[0].id);
          
                  // Clean the form data to avoid invalid date issues
        const cleanFormData = { ...formData };
        
        // Fix any invalid dates
        Object.keys(cleanFormData).forEach(key => {
          if (cleanFormData[key] instanceof Date) {
            if (isNaN(cleanFormData[key].getTime())) {
              cleanFormData[key] = null; // Replace invalid dates with null
            } else {
              cleanFormData[key] = cleanFormData[key].toISOString(); // Convert valid dates to ISO string
            }
          }
        });

        // Also fix dates in insurance entries
        if (cleanFormData.insuranceEntries && Array.isArray(cleanFormData.insuranceEntries)) {
          cleanFormData.insuranceEntries = cleanFormData.insuranceEntries.map(entry => {
            const cleanEntry = { ...entry };
            Object.keys(cleanEntry).forEach(key => {
              if (cleanEntry[key] instanceof Date) {
                if (isNaN(cleanEntry[key].getTime())) {
                  cleanEntry[key] = null;
                } else {
                  cleanEntry[key] = cleanEntry[key].toISOString();
                }
              }
            });
            return cleanEntry;
          });
        }

          await updateDoc(docRef, {
            // Update core inspection fields that might have changed
            inspectionCode: formData.inspectionCode,
            warehouseCode: formData.warehouseCode,
            warehouseName: formData.warehouseName,
            status: newStatus,
            lastUpdated: new Date().toISOString(),
            [`${newStatus}At`]: new Date().toISOString(),
            warehouseInspectionData: {
              ...cleanFormData,
              status: newStatus,
              lastUpdated: new Date().toISOString()
            }
                      });
            
            documentFound = true;
        }
      }
      
              // If not found by inspectionCode, try by warehouseCode
        if (!documentFound && formData.warehouseCode) {
          const inspectionsRef = collection(db, 'inspections');
          const q = query(inspectionsRef, where('warehouseCode', '==', formData.warehouseCode), where('status', '==', 'submitted'));
          const querySnapshot = await getDocs(q);
        
                  if (!querySnapshot.empty) {
            const docRef = doc(db, 'inspections', querySnapshot.docs[0].id);
          
                  // Clean the form data to avoid invalid date issues
        const cleanFormData2 = { ...formData };
        
        // Fix any invalid dates
        Object.keys(cleanFormData2).forEach(key => {
          if (cleanFormData2[key] instanceof Date) {
            if (isNaN(cleanFormData2[key].getTime())) {
              cleanFormData2[key] = null; // Replace invalid dates with null
            } else {
              cleanFormData2[key] = cleanFormData2[key].toISOString(); // Convert valid dates to ISO string
            }
          }
        });

        // Also fix dates in insurance entries
        if (cleanFormData2.insuranceEntries && Array.isArray(cleanFormData2.insuranceEntries)) {
          cleanFormData2.insuranceEntries = cleanFormData2.insuranceEntries.map(entry => {
            const cleanEntry = { ...entry };
            Object.keys(cleanEntry).forEach(key => {
              if (cleanEntry[key] instanceof Date) {
                if (isNaN(cleanEntry[key].getTime())) {
                  cleanEntry[key] = null;
                } else {
                  cleanEntry[key] = cleanEntry[key].toISOString();
                }
              }
            });
            return cleanEntry;
          });
        }

          await updateDoc(docRef, {
            // Update core inspection fields that might have changed
            inspectionCode: formData.inspectionCode,
            warehouseCode: formData.warehouseCode,
            warehouseName: formData.warehouseName,
            status: newStatus,
            lastUpdated: new Date().toISOString(),
            [`${newStatus}At`]: new Date().toISOString(),
            warehouseInspectionData: {
              ...cleanFormData2,
              status: newStatus,
              lastUpdated: new Date().toISOString()
            }
                      });
            
            documentFound = true;
        }
      }
      
      if (!documentFound) {
        toast({
          title: "Error",
          description: "Could not find inspection record to update",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setFormData(prev => ({ 
        ...prev, 
        status: newStatus,
        showActivationButtons: false
      }));

      // Notify parent component
      if (onStatusChange && formData.warehouseCode) {
        onStatusChange(formData.warehouseCode, newStatus);
      }

      toast({
        title: "Status Updated",
        description: actionMessage,
      });

      // Only close form for non-edit actions
      if (action !== 'edit') {
        setTimeout(() => onClose(), 1000);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  // Collapsible Card Header Component
  const CollapsibleCardHeader = ({ 
    title, 
    sectionName, 
    className = "bg-green-50"
  }: { 
    title: string; 
    sectionName: keyof typeof collapsedSections;
    className?: string;
  }) => {
    const isCollapsed = collapsedSections[sectionName];
    
    return (
      <CardHeader 
        className={`${className} cursor-pointer select-none transition-colors hover:bg-green-100`}
        onClick={() => toggleSection(sectionName)}
      >
        <CardTitle className="text-green-700 flex items-center justify-between">
          <span>{title}</span>
          <div className="transition-transform duration-200">
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </CardTitle>
      </CardHeader>
    );
  };

  // Add state for insurance usage popup
  const [showInsuranceUsagePopup, setShowInsuranceUsagePopup] = useState(false);
  const [insuranceUsageList, setInsuranceUsageList] = useState<any[]>([]);
  const [insuranceToCheck, setInsuranceToCheck] = useState<any>(null);

  // Add state for editing insurance
  const [showEditInsuranceModal, setShowEditInsuranceModal] = useState(false);
  const [insuranceToEdit, setInsuranceToEdit] = useState<any>(null);
  const [editInsuranceFields, setEditInsuranceFields] = useState<any>({});

  // Handler to open edit modal
  const handleEditInsurance = (insurance: any) => {
    setInsuranceToEdit(insurance);
    setEditInsuranceFields({
      insuranceTakenBy: insurance.insuranceTakenBy,
      insuranceCommodity: insurance.insuranceCommodity,
      firePolicyStartDate: insurance.firePolicyStartDate,
      firePolicyEndDate: insurance.firePolicyEndDate,
      burglaryPolicyStartDate: insurance.burglaryPolicyStartDate,
      burglaryPolicyEndDate: insurance.burglaryPolicyEndDate,
    });
    setShowEditInsuranceModal(true);
  };

  // Handler to save changes
  const handleSaveEditInsurance = async () => {
    if (!insuranceToEdit) return;
    // Build the updated insurance fields, defaulting to '' or null
    const updatedFields = {
      ...editInsuranceFields,
      firePolicyAmount: editInsuranceFields.firePolicyAmount ?? '',
      firePolicyCompanyName: editInsuranceFields.firePolicyCompanyName ?? '',
      firePolicyEndDate: editInsuranceFields.firePolicyEndDate ?? null,
      firePolicyNumber: editInsuranceFields.firePolicyNumber ?? '',
      firePolicyStartDate: editInsuranceFields.firePolicyStartDate ?? null,
      burglaryPolicyAmount: editInsuranceFields.burglaryPolicyAmount ?? '',
      burglaryPolicyCompanyName: editInsuranceFields.burglaryPolicyCompanyName ?? '',
      burglaryPolicyEndDate: editInsuranceFields.burglaryPolicyEndDate ?? null,
      burglaryPolicyNumber: editInsuranceFields.burglaryPolicyNumber ?? '',
      burglaryPolicyStartDate: editInsuranceFields.burglaryPolicyStartDate ?? null,
      insuranceCommodity: editInsuranceFields.insuranceCommodity ?? '',
      insuranceTakenBy: editInsuranceFields.insuranceTakenBy ?? '',
      clientName: editInsuranceFields.clientName ?? '',
      clientAddress: editInsuranceFields.clientAddress ?? '',
      selectedBankName: editInsuranceFields.selectedBankName ?? '',
    };
    // Update in inspection form state
    setFormData(prev => ({
      ...prev,
  insuranceEntries: prev.insuranceEntries.map((entry: InsuranceEntry) =>
        entry.id === insuranceToEdit.id
          ? { ...entry, ...updatedFields }
          : entry
      )
    }));
    // Update in Firestore (inspection collection) by inspectionCode
    if (formData.inspectionCode) {
      const inspectionsRef = collection(db, 'inspections');
      const q = query(inspectionsRef, where('inspectionCode', '==', formData.inspectionCode));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docRef = doc(db, 'inspections', querySnapshot.docs[0].id);
        await updateDoc(docRef, {
          insuranceEntries: formData.insuranceEntries.map((entry: InsuranceEntry) =>
            entry.id === insuranceToEdit.id
              ? { ...entry, ...updatedFields }
              : entry
          )
        });
      }
    }
    // Update in all related inward docs
    const inwardQuery = query(
      collection(db, 'inward'),
      where('selectedInsurance.insuranceId', '==', insuranceToEdit.insuranceId),
      where('selectedInsurance.insuranceTakenBy', '==', insuranceToEdit.insuranceTakenBy)
    );
    const snapshot = await getDocs(inwardQuery);
    for (const docSnap of snapshot.docs) {
      const inwardRef = doc(db, 'inward', docSnap.id);
      await updateDoc(inwardRef, {
        'selectedInsurance.insuranceTakenBy': updatedFields.insuranceTakenBy,
        'selectedInsurance.insuranceCommodity': updatedFields.insuranceCommodity,
        'selectedInsurance.firePolicyStartDate': updatedFields.firePolicyStartDate,
        'selectedInsurance.firePolicyEndDate': updatedFields.firePolicyEndDate,
        'selectedInsurance.firePolicyAmount': updatedFields.firePolicyAmount,
        'selectedInsurance.firePolicyCompanyName': updatedFields.firePolicyCompanyName,
        'selectedInsurance.firePolicyNumber': updatedFields.firePolicyNumber,
        'selectedInsurance.burglaryPolicyStartDate': updatedFields.burglaryPolicyStartDate,
        'selectedInsurance.burglaryPolicyEndDate': updatedFields.burglaryPolicyEndDate,
        'selectedInsurance.burglaryPolicyAmount': updatedFields.burglaryPolicyAmount,
        'selectedInsurance.burglaryPolicyCompanyName': updatedFields.burglaryPolicyCompanyName,
        'selectedInsurance.burglaryPolicyNumber': updatedFields.burglaryPolicyNumber,
      });
    }
    setShowEditInsuranceModal(false);
    setInsuranceToEdit(null);
  };

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Company Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Image
            src="/logo 3.jpeg"
            alt="Company Logo"
            width={100}
            height={100}
            className="rounded-full w-25 h-25 max-w-[100px] max-h-[100px] object-cover"
            style={{ width: '100px', height: '100px' }}
          />
        </div>
        <h1 className="text-3xl font-bold text-orange-600">
          AGROGREEN WAREHOUSING PRIVATE LTD.
        </h1>
        <p className="text-lg text-green-600 font-medium">
          603, 6th Floor, Princess Business Skyline, Indore, Madhya Pradesh - 452010
        </p>
        <h2 className="text-xl font-semibold text-orange-600 mt-6" style={{ textDecoration: 'underline', textDecorationColor: '#16a34a' }}>
          WAREHOUSE INSPECTION REPORT
        </h2>
        
        {/* Status and Role Indicators */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {formData.status !== 'pending' && (
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Status: {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
              {isReadOnly && <span className="ml-2 text-xs">(View Only)</span>}
            </div>
          )}
          
          {/* Role-based permission indicator */}
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            userRole === 'admin' ? 'bg-red-100 text-red-800' :
            userRole === 'checker' ? 'bg-green-100 text-green-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {userRole === 'admin' && '👑 Admin - Full Access'}
            {userRole === 'checker' && '✅ Checker - Approve/Reject/Resubmit in Active/Reactivate/Closed tabs'}
            {userRole === 'maker' && '📝 Maker - Create/Edit in Pending/Resubmit tabs'}
          </div>
          
          {/* Insurance function access indicator */}
          {canAccessInsuranceFunction(formData.status || '') && (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              🛡️ Insurance Functions Available
            </div>
          )}
        </div>
      </div>

      <style>{`
        [data-radix-select-trigger] {
          color: #ea580c !important;
        }
        [data-radix-select-value] {
          color: #ea580c !important;
        }
        [data-radix-select-content] {
          color: #ea580c !important;
        }
        [data-radix-select-item] {
          color: #ea580c !important;
        }
        [data-radix-select-item][data-highlighted] {
          color: #ea580c !important;
          background-color: rgba(234, 88, 12, 0.1) !important;
        }
        [data-radix-select-item][data-state="checked"] {
          color: #ea580c !important;
        }
        [role="combobox"] {
          color: #ea580c !important;
        }
        [role="option"] {
          color: #ea580c !important;
        }
        [role="listbox"] {
          color: #ea580c !important;
        }
        .text-orange-600 [data-radix-select-trigger],
        .text-orange-600 [data-radix-select-value],
        .text-orange-600 [data-radix-select-content],
        .text-orange-600 [data-radix-select-item] {
          color: #ea580c !important;
        }
        button[role="combobox"] {
          color: #ea580c !important;
        }
        button[role="combobox"] span {
          color: #ea580c !important;
        }
        div[role="listbox"] {
          color: #ea580c !important;
        }
        div[role="option"] {
          color: #ea580c !important;
        }
        /* More specific selectors for shadcn/ui Select */
        .select-trigger,
        .select-value,
        .select-content,
        .select-item {
          color: #ea580c !important;
        }
        /* Target all button and span elements within Select components */
        .space-y-2 button,
        .space-y-2 button span,
        .space-y-2 [data-state] {
          color: #ea580c !important;
        }
        /* Global override for any select-related elements */
        *[class*="select"] {
          color: #ea580c !important;
        }
      `}</style>
      <form onSubmit={handleSubmit} className={`space-y-8 max-w-6xl mx-auto ${isFormReadOnly ? 'form-read-only' : ''}`}>
        {/* Global read-only styles for non-pending status */}
        <style>{`
          ${isFormReadOnly ? `
            .form-read-only input:not([readonly]),
            .form-read-only textarea:not([readonly]),
            .form-read-only select,
            .form-read-only [role="combobox"],
            .form-read-only button[role="combobox"],
            .form-read-only [data-radix-select-trigger],
            .form-read-only button[type="button"]:not(.action-button) {
              pointer-events: none !important;
              background-color: #f9fafb !important;
              opacity: 0.8 !important;
              cursor: not-allowed !important;
              border-color: #d1d5db !important;
            }
            .form-read-only [data-state="open"] {
              pointer-events: none !important;
            }
          ` : ''}
        `}</style>
        {/* Basic Warehouse Details */}
        <Card className="border-green-300">
          <CollapsibleCardHeader 
            title="Warehouse Details" 
            sectionName="warehouseDetails" 
          />
          {!collapsedSections.warehouseDetails && (
            <CardContent className="p-6 space-y-4 transition-all duration-200 ease-in-out">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warehouseName">Warehouse Name <span className="text-red-500">*</span></Label>
                
                {/* For new inspections - show warehouse select dropdown */}
                {mode === 'create' && !formData.warehouseName && (
                  <Select 
                    value={formData.warehouseName} 
                    onValueChange={handleWarehouseSelect}
                  >
                    <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                      <SelectValue placeholder="Select Warehouse" className="text-orange-600" style={{ color: "#ea580c" }} />
                    </SelectTrigger>
                    <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                      {warehouses.map(warehouse => (
                        <SelectItem key={warehouse.id} value={warehouse.warehouseName}>
                          {warehouse.warehouseName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* For existing inspections - show editable warehouse name */}
                {(mode !== 'create' || formData.warehouseName) && (
                  <div className="flex gap-2">
                    {isEditingWarehouseName ? (
                      <div className="flex-1 flex gap-2">
                        <Input
                          value={editableWarehouseName}
                          onChange={(e) => setEditableWarehouseName(e.target.value)}
                          className="text-orange-600"
                          placeholder="Enter warehouse name"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleWarehouseNameSave}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleWarehouseNameCancel}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex-1 flex gap-2">
                        <Input
                          value={formData.warehouseName}
                          readOnly
                          className="bg-gray-50 text-orange-600"
                        />
                        {formData.status !== 'pending' && canEditWarehouseName() && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleWarehouseNameEdit}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="warehouseCode">Warehouse Code</Label>
                <Input
                  id="warehouseCode"
                  value={formData.warehouseCode}
                  readOnly
                  className="bg-red-50 text-red-600 font-medium border-red-200"
                  title="Warehouse code cannot be changed to maintain system integrity"
                />
                <p className="text-xs text-red-500">* Warehouse code is read-only to maintain system integrity</p>
              </div>
            </div>

            {/* Inspection Code - Only shown in view mode or when data exists */}
            {(isViewMode || formData.inspectionCode) && (
              <div className="space-y-2">
                <Label htmlFor="inspectionCode">Inspection Code</Label>
                <Input
                  id="inspectionCode"
                  value={formData.inspectionCode || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, inspectionCode: e.target.value }))}
                  className="text-orange-600"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={isFieldReadOnly('address') ? undefined : (e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                readOnly={isFieldReadOnly('address')}
                className={isFieldReadOnly('address') ? "bg-gray-50 text-orange-600" : "text-orange-600"}
                required
              />
            </div>



            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="typeOfWarehouse">Type of Warehouse <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.typeOfWarehouse} 
                  onValueChange={isFieldReadOnly('typeOfWarehouse') ? undefined : (value) => setFormData(prev => ({ ...prev, typeOfWarehouse: value }))}
                  disabled={isFieldReadOnly('typeOfWarehouse')}
                >
                  <SelectTrigger className="text-orange-600" style={{ color: '#ea580c' }}>
                    <SelectValue placeholder="Select Type" className="text-orange-600" style={{ color: '#ea580c' }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: '#ea580c' }}>
                    <SelectItem value="dry warehouse" className="text-orange-600" style={{ color: '#ea580c' }}>Dry Warehouse</SelectItem>
                    <SelectItem value="cold storage" className="text-orange-600" style={{ color: '#ea580c' }}>Cold Storage</SelectItem>
                    <SelectItem value="silo" className="text-orange-600" style={{ color: '#ea580c' }}>Silo</SelectItem>
                    <SelectItem value="tank" className="text-orange-600" style={{ color: '#ea580c' }}>Tank</SelectItem>
                    <SelectItem value="factory premises" className="text-orange-600" style={{ color: '#ea580c' }}>Factory Premises</SelectItem>
                    <SelectItem value="CM" className="text-orange-600" style={{ color: '#ea580c' }}>CM</SelectItem>
                    {customWarehouseTypes.map(type => (
                      <SelectItem key={type} value={type} style={{ color: '#ea580c' }}>{type}</SelectItem>
                    ))}
                    <SelectItem value="others" className="text-orange-600" style={{ color: "#ea580c" }}>Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.typeOfWarehouse === 'others' && (
                <div className="space-y-2">
                  <Label htmlFor="customWarehouseType">Specify Other Type <span className="text-red-500">*</span></Label>
                  <Input
                    id="customWarehouseType"
                    value={formData.customWarehouseType}
                    onChange={isFieldReadOnly('customWarehouseType') ? undefined : (e) => {
                      const value = e.target.value;
                      setFormData(prev => ({ ...prev, customWarehouseType: value }));
                      if (value && !customWarehouseTypes.includes(value)) {
                        setCustomWarehouseTypes(prev => [...prev, value]);
                      }
                    }}
                    readOnly={isFieldReadOnly('customWarehouseType')}
                    className={isFieldReadOnly('customWarehouseType') ? "bg-gray-50 text-orange-600" : "text-orange-600"}
                    required
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="license">License <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.license} 
                  onValueChange={isFieldReadOnly('license') ? undefined : (value) => setFormData(prev => ({ ...prev, license: value }))}
                  disabled={isFieldReadOnly('license')}
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="yes" className="text-orange-600" style={{ color: "#ea580c" }}>Yes</SelectItem>
                    <SelectItem value="no" className="text-orange-600" style={{ color: "#ea580c" }}>No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.license === 'yes' && (
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number <span className="text-red-500">*</span></Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={isFieldReadOnly('licenseNumber') ? undefined : (e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                    readOnly={isFieldReadOnly('licenseNumber')}
                    className={isFieldReadOnly('licenseNumber') ? "bg-gray-50 text-orange-600" : "text-orange-600"}
                    required
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Date of Inspection <span className="text-red-500">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal text-orange-600"
                    disabled={isFieldReadOnly('dateOfInspection')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.dateOfInspection && formData.dateOfInspection instanceof Date && !isNaN(formData.dateOfInspection.getTime()) ? format(formData.dateOfInspection, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                {!isFieldReadOnly('dateOfInspection') && (
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.dateOfInspection || undefined}
                      onSelect={(date) => setFormData(prev => ({ ...prev, dateOfInspection: date || null }))}
                      initialFocus
                      className="text-orange-600"
                    />
                  </PopoverContent>
                )}
              </Popover>
            </div>
          </CardContent>
          )}
        </Card>

        {/* Bank Details */}
        <Card className="border-green-300">
          <CollapsibleCardHeader 
            title="Bank Details" 
            sectionName="bankDetails" 
          />
          {!collapsedSections.bankDetails && (
            <CardContent className="p-6 space-y-4 transition-all duration-200 ease-in-out">
                {/* Bank Details Form - Show selected bank details */}
                <div className="mb-6 p-4 border border-green-200 rounded-lg bg-green-50">
                  <Label className="text-sm font-medium text-green-700 mb-3 block">
                    {isViewMode ? "Bank Details for this Inspection:" : "Select Bank Details:"}
                    {(formData.typeOfWarehouse === 'CM' || formData.typeOfWarehouse === 'cm' || formData.customWarehouseType?.toLowerCase() === 'cm') && (
                      <span className="text-red-600 text-xs font-medium block mt-1">
                        ⚠️ Bank details are mandatory for CM type warehouses
                      </span>
                    )}
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankState">Bank State <span className="text-red-500">*</span></Label>
                      <Input
                        id="bankState"
                        value={formData.bankState || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, bankState: e.target.value }))}
                        readOnly={isFieldReadOnly('bankState')}
                        className={isFieldReadOnly('bankState') ? "bg-gray-50 text-orange-600" : "text-orange-600"}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankBranch">Bank Branch <span className="text-red-500">*</span></Label>
                      <Input
                        id="bankBranch"
                        value={formData.bankBranch || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, bankBranch: e.target.value }))}
                        readOnly={isFieldReadOnly('bankBranch')}
                        className={isFieldReadOnly('bankBranch') ? "bg-gray-50 text-orange-600" : "text-orange-600"}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="bankName"
                        value={formData.bankName || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                        readOnly={isFieldReadOnly('bankName')}
                        className={isFieldReadOnly('bankName') ? "bg-gray-50 text-orange-600" : "text-orange-600"}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ifscCode">IFSC Code <span className="text-red-500">*</span></Label>
                      <Input
                        id="ifscCode"
                        value={formData.ifscCode || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, ifscCode: e.target.value }))}
                        readOnly={isFieldReadOnly('ifscCode')}
                        className={isFieldReadOnly('ifscCode') ? "bg-gray-50 text-orange-600" : "text-orange-600"}
                        required
                      />
                    </div>
                  </div>
                </div>


          </CardContent>
          )}
        </Card>

        {/* Ownership & Warehouse Details */}
        <Card className="border-green-300">
          <CollapsibleCardHeader 
            title="Ownership & Warehouse Details" 
            sectionName="ownershipDetails" 
          />
          {!collapsedSections.ownershipDetails && (
            <CardContent className="p-6 space-y-4 transition-all duration-200 ease-in-out">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="godownOwnership">Godown Ownership <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.godownOwnership} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, godownOwnership: value }))}
                  required
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select Ownership" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="proprietorship" className="text-orange-600" style={{ color: "#ea580c" }}>Proprietorship</SelectItem>
                    <SelectItem value="partnership" className="text-orange-600" style={{ color: "#ea580c" }}>Partnership</SelectItem>
                    <SelectItem value="company" className="text-orange-600" style={{ color: "#ea580c" }}>Company</SelectItem>
                    <SelectItem value="huf" className="text-orange-600" style={{ color: "#ea580c" }}>HUF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameOfClient">Name of Client <span className="text-red-500">*</span></Label>
                <Input
                  id="nameOfClient"
                  value={formData.nameOfClient}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameOfClient: e.target.value }))}
                  className="text-orange-600"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="godownOwnerName">Godown Owner Name <span className="text-red-500">*</span></Label>
                <Input
                  id="godownOwnerName"
                  value={formData.godownOwnerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, godownOwnerName: e.target.value }))}
                  className="text-orange-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="godownManagedBy">Godown Managed By <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.godownManagedBy} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, godownManagedBy: value }))}
                  required
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select Manager" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="agrogreen pvt ltd" className="text-orange-600" style={{ color: "#ea580c" }}>Agrogreen</SelectItem>
                    <SelectItem value="warehouse owner" className="text-orange-600" style={{ color: "#ea580c" }}>Warehouse Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warehouseLength">Warehouse Length (sq ft) <span className="text-red-500">*</span></Label>
                <Input
                  id="warehouseLength"
                  type="number"
                  step="0.01"
                  value={formData.warehouseLength}
                  onChange={(e) => setFormData(prev => ({ ...prev, warehouseLength: e.target.value }))}
                  className="text-orange-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warehouseBreadth">Warehouse Breadth (sq ft) <span className="text-red-500">*</span></Label>
                <Input
                  id="warehouseBreadth"
                  type="number"
                  step="0.01"
                  value={formData.warehouseBreadth}
                  onChange={(e) => setFormData(prev => ({ ...prev, warehouseBreadth: e.target.value }))}
                  className="text-orange-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warehouseHeight">Warehouse Height (sq ft) <span className="text-red-500">*</span></Label>
                <Input
                  id="warehouseHeight"
                  type="number"
                  step="0.01"
                  value={formData.warehouseHeight}
                  onChange={(e) => setFormData(prev => ({ ...prev, warehouseHeight: e.target.value }))}
                  className="text-orange-600"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="divisionFactor">Division Factor <span className="text-red-500">*</span></Label>
                <Input
                  id="divisionFactor"
                  type="number"
                  step="0.01"
                  min="3"
                  max="9"
                  value={formData.divisionFactor}
                  onChange={(e) => setFormData(prev => ({ ...prev, divisionFactor: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warehouseCapacity">Warehouse Capacity (MT)</Label>
                <Input
                  id="warehouseCapacity"
                  value={formData.warehouseCapacity}
                  readOnly
                  className="bg-gray-50 text-orange-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="constructionYear">Construction Year <span className="text-red-500">*</span></Label>
                <Input
                  id="constructionYear"
                  type="number"
                  min="1900"
                  max="2030"
                  value={formData.constructionYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, constructionYear: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="totalChambers">Total Number of Chambers <span className="text-red-500">*</span></Label>
                  <Button
                    type="button"
                    onClick={addChamber}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Chamber
                  </Button>
                </div>
                <Input
                  id="totalChambers"
                  value={formData.totalChambers}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalChambers: e.target.value }))}
                  className="text-orange-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude <span className="text-red-500">*</span></Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                  className="text-orange-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude <span className="text-red-500">*</span></Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                  className="text-orange-600"
                  required
                />
              </div>
            </div>

            {/* Chamber Details */}
            {formData.chambers.length > 0 && (
              <div className="space-y-4">
                <Label className="text-lg font-semibold text-green-700">Chamber Details</Label>
                {formData.chambers.map((chamber: ChamberData, index: number) => (
                  <Card key={chamber.id} className="border-orange-200">
                    <CardHeader className="bg-orange-50 pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-orange-700 text-base">Chamber {index + 1}</CardTitle>
                        <Button
                          type="button"
                          onClick={() => removeChamber(chamber.id)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-2">
                          <Label>Length (sq ft) <span className="text-red-500">*</span></Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={chamber.length}
                            onChange={(e) => updateChamber(chamber.id, 'length', e.target.value)}
                            className="text-orange-600"
                            placeholder="Enter length"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Breadth (sq ft) <span className="text-red-500">*</span></Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={chamber.breadth}
                            onChange={(e) => updateChamber(chamber.id, 'breadth', e.target.value)}
                            className="text-orange-600"
                            placeholder="Enter breadth"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Height (sq ft) <span className="text-red-500">*</span></Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={chamber.height}
                            onChange={(e) => updateChamber(chamber.id, 'height', e.target.value)}
                            className="text-orange-600"
                            placeholder="Enter height"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Division Factor <span className="text-red-500">*</span></Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={chamber.divisionFactor}
                            onChange={(e) => updateChamber(chamber.id, 'divisionFactor', e.target.value)}
                            className="text-orange-600"
                            placeholder="Enter division factor"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Capacity (Calculated)</Label>
                          <Input
                            value={chamber.capacity}
                            readOnly
                            className="bg-gray-100 text-gray-700"
                            placeholder="Auto-calculated"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
          )}
        </Card>

        {/* Physical Condition of Warehouse */}
        <Card className="border-green-300">
          <CollapsibleCardHeader 
            title="Physical Condition of Warehouse" 
            sectionName="physicalCondition" 
          />
          {!collapsedSections.physicalCondition && (
            <CardContent className="p-6 space-y-4 transition-all duration-200 ease-in-out">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="flooring">Flooring <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.flooring} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, flooring: value }))}
                  required
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select Flooring" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="cemented" className="text-orange-600" style={{ color: "#ea580c" }}>Cemented</SelectItem>
                    <SelectItem value="bricks" className="text-orange-600" style={{ color: "#ea580c" }}>Bricks</SelectItem>
                    <SelectItem value="wooden floor" className="text-orange-600" style={{ color: "#ea580c" }}>Wooden Floor</SelectItem>
                    <SelectItem value="stone" className="text-orange-600" style={{ color: "#ea580c" }}>Stone</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shutterDoor">Shutter/Door <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.shutterDoor} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, shutterDoor: value }))}
                  required
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select Type" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="iron" className="text-orange-600" style={{ color: "#ea580c" }}>Iron</SelectItem>
                                          {customShutterTypes.map(type => (
                        <SelectItem key={type} value={type} style={{ color: '#ea580c' }}>{type}</SelectItem>
                      ))}
                    <SelectItem value="other" className="text-orange-600" style={{ color: "#ea580c" }}>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.shutterDoor === 'other' && (
              <div className="space-y-2">
                <Label htmlFor="customShutterDoor">Specify Other Door Type <span className="text-red-500">*</span></Label>
                <Input
                  id="customShutterDoor"
                  value={formData.customShutterDoor}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({ ...prev, customShutterDoor: value }));
                    if (value && !customShutterTypes.includes(value)) {
                      setCustomShutterTypes(prev => [...prev, value]);
                    }
                  }}
                  className="text-orange-600"
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="walls">Walls <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.walls} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, walls: value }))}
                  required
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select Wall Type" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="metal" className="text-orange-600" style={{ color: "#ea580c" }}>Metal</SelectItem>
                    <SelectItem value="bricks" className="text-orange-600" style={{ color: "#ea580c" }}>Bricks</SelectItem>
                    <SelectItem value="metal+bricks" className="text-orange-600" style={{ color: "#ea580c" }}>Metal + Bricks</SelectItem>
                    <SelectItem value="cemented" className="text-orange-600" style={{ color: "#ea580c" }}>Cemented</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roof">Roof <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.roof} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, roof: value }))}
                  required
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select Roof Type" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="cemented" className="text-orange-600" style={{ color: "#ea580c" }}>Cemented</SelectItem>
                    <SelectItem value="tin" className="text-orange-600" style={{ color: "#ea580c" }}>Tin</SelectItem>
                    <SelectItem value="concrete" className="text-orange-600" style={{ color: "#ea580c" }}>Concrete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plinthHeight">Plinth Height (sq ft) <span className="text-red-500">*</span></Label>
                <Input
                  id="plinthHeight"
                  type="number"
                  step="0.01"
                  min="1"
                  max="10"
                  value={formData.plinthHeight}
                  onChange={(e) => setFormData(prev => ({ ...prev, plinthHeight: e.target.value }))}
                  className="text-orange-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="anyLeakage">Any Leakage <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.anyLeakage} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, anyLeakage: value }))}
                  required
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="yes" className="text-orange-600" style={{ color: "#ea580c" }}>Yes</SelectItem>
                    <SelectItem value="no" className="text-orange-600" style={{ color: "#ea580c" }}>No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="drainageChannels">Drainage Channels <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.drainageChannels} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, drainageChannels: value }))}
                  required
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="yes" className="text-orange-600" style={{ color: "#ea580c" }}>Yes</SelectItem>
                    <SelectItem value="no" className="text-orange-600" style={{ color: "#ea580c" }}>No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="electricWiring">Electric Wiring Inside Warehouse <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.electricWiring} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, electricWiring: value }))}
                  required
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="yes" className="text-orange-600" style={{ color: "#ea580c" }}>Yes</SelectItem>
                    <SelectItem value="no" className="text-orange-600" style={{ color: "#ea580c" }}>No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="compoundWallAvailability">Compound Wall Availability <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.compoundWallAvailability}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, compoundWallAvailability: value }))}
                  required
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="yes" className="text-orange-600" style={{ color: "#ea580c" }}>Yes</SelectItem>
                    <SelectItem value="no" className="text-orange-600" style={{ color: "#ea580c" }}>No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.compoundWallAvailability === 'yes' && (
              <div className="space-y-2">
                <Label htmlFor="typeOfWall">Type of Wall <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.typeOfWall}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, typeOfWall: value }))}
                  required
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select Wall Type" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="iron" className="text-orange-600" style={{ color: "#ea580c" }}>Iron</SelectItem>
                    <SelectItem value="cemented" className="text-orange-600" style={{ color: "#ea580c" }}>Cemented</SelectItem>
                    <SelectItem value="wire fencing" className="text-orange-600" style={{ color: "#ea580c" }}>Wire Fencing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="compoundGate">Compound Gate <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.compoundGate}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, compoundGate: value }))}
                  required
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="yes" className="text-orange-600" style={{ color: "#ea580c" }}>Yes</SelectItem>
                    <SelectItem value="no" className="text-orange-600" style={{ color: "#ea580c" }}>No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.compoundGate === 'yes' && (
                <div className="space-y-2">
                  <Label htmlFor="numberOfGates">Number of Gates <span className="text-red-500">*</span></Label>
                  <Input
                    id="numberOfGates"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.numberOfGates}
                    onChange={(e) => setFormData(prev => ({ ...prev, numberOfGates: e.target.value }))}
                  className="text-orange-600"
                  required
                />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="isWarehouseClean">Is Warehouse Clean <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.isWarehouseClean}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, isWarehouseClean: value }))}
                  required
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="yes" className="text-orange-600" style={{ color: "#ea580c" }}>Yes</SelectItem>
                    <SelectItem value="no" className="text-orange-600" style={{ color: "#ea580c" }}>No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="waterAvailability">Water Availability <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.waterAvailability}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, waterAvailability: value }))}
                  required
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="yes" className="text-orange-600" style={{ color: "#ea580c" }}>Yes</SelectItem>
                    <SelectItem value="no" className="text-orange-600" style={{ color: "#ea580c" }}>No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.waterAvailability === 'yes' && (
              <div className="space-y-2">
                <Label htmlFor="typeOfAvailability">Type of Availability <span className="text-red-500">*</span></Label>
                <Input
                  id="typeOfAvailability"
                  value={formData.typeOfAvailability}
                  onChange={(e) => setFormData(prev => ({ ...prev, typeOfAvailability: e.target.value }))}
                  className="text-orange-600"
                  required
                />
              </div>
            )}
          </CardContent>
          )}
        </Card>

        {/* Cold Storage Section (conditional) */}
        {formData.typeOfWarehouse === 'cold storage' && (
          <Card className="border-green-300">
            <CollapsibleCardHeader 
            title="Cold Storage Details" 
            sectionName="coldStorageDetails" 
          />
          {!collapsedSections.coldStorageDetails && (
            <CardContent className="p-6 space-y-4 transition-all duration-200 ease-in-out">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="typeOfColdStorage">Type of Cold Storage <span className="text-red-500">*</span></Label>
                  <Input
                    id="typeOfColdStorage"
                    value={formData.typeOfColdStorage}
                    onChange={(e) => setFormData(prev => ({ ...prev, typeOfColdStorage: e.target.value }))}
                  className="text-orange-600"
                  required
                />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="typeOfCoolingSystem">Type of Cooling System <span className="text-red-500">*</span></Label>
                  <Input
                    id="typeOfCoolingSystem"
                    value={formData.typeOfCoolingSystem}
                    onChange={(e) => setFormData(prev => ({ ...prev, typeOfCoolingSystem: e.target.value }))}
                  className="text-orange-600"
                  required
                />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="typeOfInsulation">Type of Insulation <span className="text-red-500">*</span></Label>
                  <Input
                    id="typeOfInsulation"
                    value={formData.typeOfInsulation}
                    onChange={(e) => setFormData(prev => ({ ...prev, typeOfInsulation: e.target.value }))}
                  className="text-orange-600"
                  required
                />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperatureMaintained">Temperature Maintained <span className="text-red-500">*</span></Label>
                  <Input
                    id="temperatureMaintained"
                    value={formData.temperatureMaintained}
                    onChange={(e) => setFormData(prev => ({ ...prev, temperatureMaintained: e.target.value }))}
                  className="text-orange-600"
                  required
                />
                </div>
              </div>
            </CardContent>
            )}
          </Card>
        )}

        {/* Insurance of Stock */}
        <Card className="border-green-300">
          <CollapsibleCardHeader 
            title="Insurance of Stock" 
            sectionName="insuranceDetails" 
          />
          {!collapsedSections.insuranceDetails && (
            <CardContent className="p-6 space-y-4 transition-all duration-200 ease-in-out">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insuranceTakenBy">Insurance Taken By</Label>
                <Select 
                  value={formData.insuranceTakenBy} 
                  onValueChange={async (value) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      insuranceTakenBy: value, 
                      clientName: '', 
                      clientAddress: '', 
                      selectedBankName: '' 
                    }));
                    // Clear insurance data when insurance type changes
                    setClientInsuranceData([]);
                    setSelectedClientInsurances([]);
                    setAgrogreenInsuranceData([]);
                    setSelectedAgrogreenInsurances([]);
                    setWarehouseInsuranceData([]);
                    setSelectedWarehouseInsurances([]);
                    
                    // Load Agrogreen insurance data if Agrogreen is selected
                    if (value === 'agrogreen') {
                      try {
                        console.log('Loading Agrogreen insurance data');
                        const agrogreenDocs = await getDocs(collection(db, 'agrogreen'));
                        if (!agrogreenDocs.empty) {
                          const agrogreenInsurances = agrogreenDocs.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data(),
                            sourceDocumentId: doc.id, // Document ID from Agrogreen collection
                            sourceCollection: 'agrogreen' // Mark as from Agrogreen collection
                          }));
                          console.log('Found Agrogreen insurance data:', agrogreenInsurances);
                          setAgrogreenInsuranceData(agrogreenInsurances);
                        } else {
                          console.log('No Agrogreen insurance data found');
                          setAgrogreenInsuranceData([]);
                        }
                      } catch (error) {
                        console.error('Error loading Agrogreen insurance data:', error);
                        setAgrogreenInsuranceData([]);
                      }
                    }
                    
                    // Load Warehouse Owner insurance data if Warehouse Owner is selected
                    if (value === 'warehouse owner') {
                      try {
                        console.log('Loading Warehouse Owner insurance data');
                        const insuranceDocs = await getDocs(collection(db, 'insurance'));
                        if (!insuranceDocs.empty) {
                          const warehouseInsurances = insuranceDocs.docs
                            .map(doc => ({
                              id: doc.id,
                              ...doc.data(),
                              sourceDocumentId: doc.id,
                              sourceCollection: 'insurance'
                            }))
                            .filter(insurance => insurance.insuranceType === 'warehouse-owner');
                          console.log('Found Warehouse Owner insurance data:', warehouseInsurances);
                          setWarehouseInsuranceData(warehouseInsurances);
                        } else {
                          console.log('No Warehouse Owner insurance data found');
                          setWarehouseInsuranceData([]);
                        }
                      } catch (error) {
                        console.error('Error loading Warehouse Owner insurance data:', error);
                        setWarehouseInsuranceData([]);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="warehouse owner" className="text-orange-600" style={{ color: "#ea580c" }}>Warehouse Owner</SelectItem>
                    <SelectItem value="client" className="text-orange-600" style={{ color: "#ea580c" }}>Client</SelectItem>
                    <SelectItem value="bank" className="text-orange-600" style={{ color: "#ea580c" }}>Bank</SelectItem>
                    <SelectItem value="agrogreen" className="text-orange-600" style={{ color: "#ea580c" }}>Agrogreen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="insuranceCommodity">Commodity <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.insuranceCommodity}
                  onValueChange={async (value) => {
                    setFormData(prev => ({ ...prev, insuranceCommodity: value }));
                    setSelectedInsurancePolicy(''); // Reset policy selection when commodity changes
                    
                    // If client is already selected, re-filter and auto-fill based on new commodity
                    if (formData.clientName && clientInsuranceData.length > 0) {
                      const filteredInsurances = clientInsuranceData.filter((ins: any) => 
                        ins.commodity && ins.commodity.toLowerCase() === value.toLowerCase()
                      );
                      
                      console.log('Re-filtered main form insurances for commodity:', value, filteredInsurances);
                      
                      // Auto-fill with the first matching insurance if available
                      if (filteredInsurances.length > 0) {
                        const matchingInsurance = filteredInsurances[0];
                        setFormData(prev => ({
                          ...prev,
                          insuranceCommodity: value,
                          firePolicyCompanyName: matchingInsurance.firePolicyCompanyName || '',
                          firePolicyNumber: matchingInsurance.firePolicyNumber || '',
                          firePolicyAmount: matchingInsurance.firePolicyAmount || '',
                          firePolicyStartDate: safeCreateDate(matchingInsurance.firePolicyStartDate),
                          firePolicyEndDate: safeCreateDate(matchingInsurance.firePolicyEndDate),
                          burglaryPolicyCompanyName: matchingInsurance.burglaryPolicyCompanyName || '',
                          burglaryPolicyNumber: matchingInsurance.burglaryPolicyNumber || '',
                          burglaryPolicyAmount: matchingInsurance.burglaryPolicyAmount || '',
                          burglaryPolicyStartDate: safeCreateDate(matchingInsurance.burglaryPolicyStartDate),
                          burglaryPolicyEndDate: safeCreateDate(matchingInsurance.burglaryPolicyEndDate),
                        }));
                        
                        console.log('Re-filled main form with commodity-specific insurance data');
                      }
                    }
                  }}
                >
                  <SelectTrigger className="text-orange-600">
                    <SelectValue placeholder="Select commodity" />
                  </SelectTrigger>
                  <SelectContent>
                    {commoditiesData.map(commodity => (
                      <SelectItem key={commodity.id} value={commodity.commodityName}>
                        {commodity.commodityName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Insurance Policy Selection - shows when client + commodity are selected */}
            {formData.insuranceTakenBy === 'client' && formData.clientName && formData.insuranceCommodity && clientInsuranceData.length > 0 && (
              <div className="space-y-2">
                <Label>Select Insurance Policy</Label>
                <Select
                  value={selectedInsurancePolicy}
                  onValueChange={(value) => {
                    setSelectedInsurancePolicy(value);
                    
                    // Find the selected insurance and auto-fill the form
                    const selectedInsurance = clientInsuranceData.find((ins: any, index: number) => 
                      `${index}-${ins.firePolicyNumber || ''}-${ins.burglaryPolicyNumber || ''}` === value
                    );
                    
                    if (selectedInsurance) {
                      setFormData(prev => ({
                        ...prev,
                        firePolicyCompanyName: selectedInsurance.firePolicyCompanyName || '',
                        firePolicyNumber: selectedInsurance.firePolicyNumber || '',
                        firePolicyAmount: selectedInsurance.firePolicyAmount || '',
                        firePolicyStartDate: safeCreateDate(selectedInsurance.firePolicyStartDate),
                        firePolicyEndDate: safeCreateDate(selectedInsurance.firePolicyEndDate),
                        burglaryPolicyCompanyName: selectedInsurance.burglaryPolicyCompanyName || '',
                        burglaryPolicyNumber: selectedInsurance.burglaryPolicyNumber || '',
                        burglaryPolicyAmount: selectedInsurance.burglaryPolicyAmount || '',
                        burglaryPolicyStartDate: safeCreateDate(selectedInsurance.burglaryPolicyStartDate),
                        burglaryPolicyEndDate: safeCreateDate(selectedInsurance.burglaryPolicyEndDate),
                        remainingFirePolicyAmount: selectedInsurance.remainingFirePolicyAmount || '',
                        remainingBurglaryPolicyAmount: selectedInsurance.remainingBurglaryPolicyAmount || '',
                      }));
                      
                      console.log('Auto-filled form with selected insurance policy:', selectedInsurance);
                    }
                  }}
                >
                  <SelectTrigger className="text-orange-600">
                    <SelectValue placeholder="Choose insurance policy" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientInsuranceData
                      .filter((ins: any) => !formData.insuranceCommodity || 
                        (ins.commodity && ins.commodity.toLowerCase() === formData.insuranceCommodity.toLowerCase())
                      )
                      .map((insurance: any, index: number) => {
                        const policyKey = `${index}-${insurance.firePolicyNumber || ''}-${insurance.burglaryPolicyNumber || ''}`;
                        const displayText = `Fire: ${insurance.firePolicyCompanyName || 'N/A'} (${insurance.firePolicyNumber || 'N/A'}) | Burglary: ${insurance.burglaryPolicyCompanyName || 'N/A'} (${insurance.burglaryPolicyNumber || 'N/A'})`;
                        
                        return (
                          <SelectItem key={policyKey} value={policyKey}>
                            {displayText}
                          </SelectItem>
                        );
                      })
                    }
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Client Name and Address dropdowns for Client selection */}
              {formData.insuranceTakenBy === 'client' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name <span className="text-red-500">*</span></Label>
                    <Select 
                      value={formData.clientName} 
                      onValueChange={async (value) => {
                        const selectedClient = clientsData.find(client => client.firmName === value);
                        
                        // Load client insurance data
                        if (selectedClient) {
                          try {
                            console.log('Loading insurance data for client:', value);
                            const combinedInsurances = await fetchClientInsurances(value);
                          
                            console.log('Combined insurance data found:', combinedInsurances);
                            setClientInsuranceData(combinedInsurances);
                            setSelectedInsurancePolicy(''); // Reset policy selection when client changes
                            
                            // Auto-fill form with first matching insurance if available
                            if (combinedInsurances.length > 0) {
                              // Filter by commodity if selected
                              let filteredInsurances = combinedInsurances;
                              if (formData.insuranceCommodity) {
                                filteredInsurances = combinedInsurances.filter((ins: any) => 
                                  ins.commodity && ins.commodity.toLowerCase() === formData.insuranceCommodity.toLowerCase()
                                );
                              }
                              
                              const insuranceToUse = filteredInsurances.length > 0 ? filteredInsurances[0] : combinedInsurances[0];
                              
                              setFormData(prev => ({
                                ...prev,
                                clientName: value,
                                clientAddress: selectedClient?.companyAddress || '',
                                insuranceCommodity: insuranceToUse.commodity || prev.insuranceCommodity,
                                firePolicyCompanyName: insuranceToUse.firePolicyCompanyName || '',
                                firePolicyNumber: insuranceToUse.firePolicyNumber || '',
                                firePolicyAmount: insuranceToUse.firePolicyAmount || '',
                                firePolicyStartDate: safeCreateDate(insuranceToUse.firePolicyStartDate),
                                firePolicyEndDate: safeCreateDate(insuranceToUse.firePolicyEndDate),
                                burglaryPolicyCompanyName: insuranceToUse.burglaryPolicyCompanyName || '',
                                burglaryPolicyNumber: insuranceToUse.burglaryPolicyNumber || '',
                                burglaryPolicyAmount: insuranceToUse.burglaryPolicyAmount || '',
                                burglaryPolicyStartDate: safeCreateDate(insuranceToUse.burglaryPolicyStartDate),
                                burglaryPolicyEndDate: safeCreateDate(insuranceToUse.burglaryPolicyEndDate),
                                remainingFirePolicyAmount: insuranceToUse.remainingFirePolicyAmount || '',
                                remainingBurglaryPolicyAmount: insuranceToUse.remainingBurglaryPolicyAmount || '',
                              }));
                              
                              console.log('Auto-filled main form with insurance data');
                            }
                          } catch (error) {
                            console.error('Error loading client insurance data:', error);
                            setClientInsuranceData([]);
                          }
                        } else {
                          console.log('No selected client found');
                          setClientInsuranceData([]);
                          // Just set basic client info if no insurance data
                          setFormData(prev => ({ 
                            ...prev, 
                            clientName: value,
                            clientAddress: ''
                          }));
                        }
                      }}
                      required
                    >
                      <SelectTrigger className="text-orange-600">
                        <SelectValue placeholder="Select Client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientsData.map(client => (
                          <SelectItem key={client.id} value={client.firmName}>
                            {client.firmName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientAddress">Client Address <span className="text-red-500">*</span></Label>
                    <Select 
                      value={formData.clientAddress} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, clientAddress: value }))}
                      required
                    >
                      <SelectTrigger className="text-orange-600">
                        <SelectValue placeholder="Select Address" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientsData
                          .filter(client => formData.clientName ? client.firmName === formData.clientName : true)
                          .map(client => (
                            <SelectItem key={client.id} value={client.companyAddress}>
                              {client.companyAddress}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Client Insurance Selection */}
                  {clientInsuranceData.length > 0 && (
                    <div className="md:col-span-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-green-600 font-medium">Select Client Insurance Policies</Label>
                          {selectedClientInsurances.length > 0 && (
                            <div className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                              {selectedClientInsurances.length} selected 
                              {selectedClientInsurances.length === 1 ? ' (filling main form)' : ` (1 main + ${selectedClientInsurances.length - 1} additional)`}
                            </div>
                          )}
                        </div>
                        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                          {selectedClientInsurances.length === 0 && (
                            <div className="text-xs text-green-600 mb-3 p-2 bg-green-100 rounded">
                              💡 <strong>Tip:</strong> Select insurance policies below to automatically fill the Fire Policy and Burglary Policy details sections. 
                              Multiple selections will create additional form sections.
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {clientInsuranceData.map((insurance, index) => (
                              <div key={index} className="border border-green-300 rounded p-3 bg-white">
                                <div className="flex items-center space-x-2 mb-2">
                                  <input
                                    type="checkbox"
                                    id={`insurance-${index}`}
                                    checked={selectedClientInsurances.some(selected => 
                                      selected.firePolicyNumber === insurance.firePolicyNumber && 
                                      selected.burglaryPolicyNumber === insurance.burglaryPolicyNumber
                                    )}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedClientInsurances(prev => [...prev, insurance]);
                                        
                                        // Auto-fill form data with selected insurance
                                        if (selectedClientInsurances.length === 0) {
                                          // First selection - fill the main form fields
                                          setFormData(prev => ({
                                            ...prev,
                                            // Fire Policy Details
                                            firePolicyCompanyName: insurance.firePolicyCompanyName || '',
                                            firePolicyNumber: insurance.firePolicyNumber || '',
                                            firePolicyAmount: insurance.firePolicyAmount || '',
                                            firePolicyStartDate: safeCreateDate(insurance.firePolicyStartDate),
                                            firePolicyEndDate: safeCreateDate(insurance.firePolicyEndDate),
                                            // Burglary Policy Details
                                            burglaryPolicyCompanyName: insurance.burglaryPolicyCompanyName || '',
                                            burglaryPolicyNumber: insurance.burglaryPolicyNumber || '',
                                            burglaryPolicyAmount: insurance.burglaryPolicyAmount || '',
                                            burglaryPolicyStartDate: safeCreateDate(insurance.burglaryPolicyStartDate),
                                            burglaryPolicyEndDate: safeCreateDate(insurance.burglaryPolicyEndDate),
                                            // Remaining amounts from insurance master
                                            remainingFirePolicyAmount: insurance.remainingFirePolicyAmount || '',
                                            remainingBurglaryPolicyAmount: insurance.remainingBurglaryPolicyAmount || '',
                                          }));
                                        } else {
                                          // Additional selections - add to additional sections
                                          setAdditionalInsuranceSections(prev => [...prev, {
                                            id: `additional-${Date.now()}-${Math.random()}`,
                                            insurance: insurance,
                                            sectionNumber: prev.length + 2 // Starting from 2 since main form is 1
                                          }]);
                                        }
                                      } else {
                                        setSelectedClientInsurances(prev => 
                                          prev.filter(selected => 
                                            !(selected.firePolicyNumber === insurance.firePolicyNumber && 
                                              selected.burglaryPolicyNumber === insurance.burglaryPolicyNumber)
                                          )
                                        );
                                        
                                        // Check if this was the insurance that filled the main form
                                        if (formData.firePolicyNumber === insurance.firePolicyNumber && 
                                            formData.burglaryPolicyNumber === insurance.burglaryPolicyNumber) {
                                          // Clear form data when unchecking the insurance that filled it
                                          setFormData(prev => ({
                                            ...prev,
                                            // Clear Fire Policy Details
                                            firePolicyCompanyName: '',
                                            firePolicyNumber: '',
                                            firePolicyAmount: '',
                                            firePolicyStartDate: null,
                                            firePolicyEndDate: null,
                                            // Clear Burglary Policy Details
                                            burglaryPolicyCompanyName: '',
                                            burglaryPolicyNumber: '',
                                            burglaryPolicyAmount: '',
                                            burglaryPolicyStartDate: null,
                                            burglaryPolicyEndDate: null,
                                            // Clear remaining amounts
                                            remainingFirePolicyAmount: '',
                                            remainingBurglaryPolicyAmount: '',
                                          }));
                                          
                                          // If there are other selected insurances, fill with the first one
                                          const remainingInsurances = selectedClientInsurances.filter(selected => 
                                            !(selected.firePolicyNumber === insurance.firePolicyNumber && 
                                              selected.burglaryPolicyNumber === insurance.burglaryPolicyNumber)
                                          );
                                          
                                          if (remainingInsurances.length > 0) {
                                            const firstRemaining = remainingInsurances[0];
                                            setFormData(prev => ({
                                              ...prev,
                                              // Fire Policy Details
                                              firePolicyCompanyName: firstRemaining.firePolicyCompanyName || '',
                                              firePolicyNumber: firstRemaining.firePolicyNumber || '',
                                              firePolicyAmount: firstRemaining.firePolicyAmount || '',
                                              firePolicyStartDate: safeCreateDate(firstRemaining.firePolicyStartDate),
                                              firePolicyEndDate: safeCreateDate(firstRemaining.firePolicyEndDate),
                                              // Burglary Policy Details
                                              burglaryPolicyCompanyName: firstRemaining.burglaryPolicyCompanyName || '',
                                              burglaryPolicyNumber: firstRemaining.burglaryPolicyNumber || '',
                                              burglaryPolicyAmount: firstRemaining.burglaryPolicyAmount || '',
                                              burglaryPolicyStartDate: safeCreateDate(firstRemaining.burglaryPolicyStartDate),
                                              burglaryPolicyEndDate: safeCreateDate(firstRemaining.burglaryPolicyEndDate),
                                              // Remaining amounts from insurance master
                                              remainingFirePolicyAmount: firstRemaining.remainingFirePolicyAmount || '',
                                              remainingBurglaryPolicyAmount: firstRemaining.remainingBurglaryPolicyAmount || '',
                                            }));
                                            
                                            // Remove from additional sections if it was there
                                            setAdditionalInsuranceSections(prev => 
                                              prev.filter(section => 
                                                !(section.insurance.firePolicyNumber === firstRemaining.firePolicyNumber && 
                                                  section.insurance.burglaryPolicyNumber === firstRemaining.burglaryPolicyNumber)
                                              )
                                            );
                                          }
                                        } else {
                                          // Remove from additional sections
                                          setAdditionalInsuranceSections(prev => 
                                            prev.filter(section => 
                                              !(section.insurance.firePolicyNumber === insurance.firePolicyNumber && 
                                                section.insurance.burglaryPolicyNumber === insurance.burglaryPolicyNumber)
                                            )
                                          );
                                        }
                                      }
                                    }}
                                    className="text-green-600"
                                  />
                                  <label htmlFor={`insurance-${index}`} className="text-sm font-medium text-green-700">
                                    Insurance {index + 1}
                                  </label>
                                </div>
                                <div className="text-xs text-green-600 space-y-1">
                                  <div><strong>Insurance ID:</strong> {insurance.insuranceId || 'N/A'}</div>
                                  <div><strong>Commodity:</strong> {insurance.commodity}</div>
                                  <div><strong>Fire Policy:</strong> {insurance.firePolicyNumber}</div>
                                  <div><strong>Burglary Policy:</strong> {insurance.burglaryPolicyNumber}</div>
                                  <div><strong>Fire Amount:</strong> ₹{insurance.firePolicyAmount}</div>
                                  <div><strong>Fire Remaining:</strong> ₹{insurance.remainingFirePolicyAmount}</div>
                                  <div><strong>Burglary Amount:</strong> ₹{insurance.burglaryPolicyAmount}</div>
                                  <div><strong>Burglary Remaining:</strong> ₹{insurance.remainingBurglaryPolicyAmount}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {selectedClientInsurances.length > 0 && (
                            <div className="mt-3 p-2 bg-green-100 rounded">
                              <div className="text-sm font-medium text-green-700">
                                Selected: {selectedClientInsurances.length} insurance policy(ies)
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Bank Name dropdown for Bank selection */}
              {formData.insuranceTakenBy === 'bank' && (
                <div className="space-y-2">
                  <Label htmlFor="selectedBankName">Bank Name <span className="text-red-500">*</span></Label>
                  <Select 
                    value={formData.selectedBankName} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, selectedBankName: value }))}
                    required
                  >
                    <SelectTrigger className="text-orange-600">
                      <SelectValue placeholder="Select Bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {insuranceBanks.map((bank, index) => (
                        <SelectItem key={index} value={bank.name}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Agrogreen Insurance Selection */}
              {formData.insuranceTakenBy === 'agrogreen' && agrogreenInsuranceData.length > 0 && (
                <div className="md:col-span-2">
                  <div className="space-y-2">
                    <Label className="text-green-600 font-medium">Select Agrogreen Insurance Policies</Label>
                    <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {agrogreenInsuranceData.map((insurance, index) => (
                          <div key={index} className="border border-green-300 rounded p-3 bg-white">
                            <div className="flex items-center space-x-2 mb-2">
                              <input
                                type="checkbox"
                                id={`agrogreen-insurance-${index}`}
                                checked={selectedAgrogreenInsurances.some(selected => 
                                  selected.firePolicyNumber === insurance.firePolicyNumber && 
                                  selected.burglaryPolicyNumber === insurance.burglaryPolicyNumber
                                )}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAgrogreenInsurances(prev => [...prev, insurance]);
                                    
                                    // Auto-fill form data with selected insurance (first selection fills main form)
                                    if (selectedAgrogreenInsurances.length === 0) {
                                      setFormData(prev => ({
                                        ...prev,
                                        // Fire Policy Details
                                        firePolicyCompanyName: insurance.firePolicyCompanyName || '',
                                        firePolicyNumber: insurance.firePolicyNumber || '',
                                        firePolicyAmount: insurance.firePolicyAmount || '',
                                        firePolicyStartDate: safeCreateDate(insurance.firePolicyStartDate),
                                        firePolicyEndDate: safeCreateDate(insurance.firePolicyEndDate),
                                        // Burglary Policy Details
                                        burglaryPolicyCompanyName: insurance.burglaryPolicyCompanyName || '',
                                        burglaryPolicyNumber: insurance.burglaryPolicyNumber || '',
                                        burglaryPolicyAmount: insurance.burglaryPolicyAmount || '',
                                        burglaryPolicyStartDate: safeCreateDate(insurance.burglaryPolicyStartDate),
                                        burglaryPolicyEndDate: safeCreateDate(insurance.burglaryPolicyEndDate),
                                        // Remaining amounts from insurance
                                        remainingFirePolicyAmount: insurance.remainingFirePolicyAmount || '',
                                        remainingBurglaryPolicyAmount: insurance.remainingBurglaryPolicyAmount || '',
                                      }));
                                      console.log('Auto-filled form with Agrogreen insurance:', insurance);
                                    }
                                  } else {
                                    setSelectedAgrogreenInsurances(prev => 
                                      prev.filter(selected => 
                                        !(selected.firePolicyNumber === insurance.firePolicyNumber && 
                                          selected.burglaryPolicyNumber === insurance.burglaryPolicyNumber)
                                      )
                                    );
                                    
                                    // Clear form data if this was the insurance that filled the main form
                                    if (formData.firePolicyNumber === insurance.firePolicyNumber && 
                                        formData.burglaryPolicyNumber === insurance.burglaryPolicyNumber) {
                                      setFormData(prev => ({
                                        ...prev,
                                        // Clear Fire Policy Details
                                        firePolicyCompanyName: '',
                                        firePolicyNumber: '',
                                        firePolicyAmount: '',
                                        firePolicyStartDate: null,
                                        firePolicyEndDate: null,
                                        // Clear Burglary Policy Details
                                        burglaryPolicyCompanyName: '',
                                        burglaryPolicyNumber: '',
                                        burglaryPolicyAmount: '',
                                        burglaryPolicyStartDate: null,
                                        burglaryPolicyEndDate: null,
                                        // Clear remaining amounts
                                        remainingFirePolicyAmount: '',
                                        remainingBurglaryPolicyAmount: '',
                                      }));
                                      console.log('Cleared form data when unchecking Agrogreen insurance');
                                    }
                                  }
                                }}
                                className="text-green-600"
                              />
                              <label htmlFor={`agrogreen-insurance-${index}`} className="text-sm font-medium text-green-700">
                                Agrogreen Insurance {index + 1}
                              </label>
                            </div>
                            <div className="text-xs text-green-600 space-y-1">
                              <div><strong>Insurance ID:</strong> {insurance.insuranceId || 'N/A'}</div>
                              <div><strong>Commodity:</strong> {insurance.commodity}</div>
                              <div><strong>Fire Policy:</strong> {insurance.firePolicyNumber}</div>
                              <div><strong>Burglary Policy:</strong> {insurance.burglaryPolicyNumber}</div>
                              <div><strong>Fire Amount:</strong> ₹{insurance.firePolicyAmount}</div>
                              <div><strong>Burglary Amount:</strong> ₹{insurance.burglaryPolicyAmount}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {selectedAgrogreenInsurances.length > 0 && (
                        <div className="mt-3 p-2 bg-green-100 rounded">
                          <div className="text-sm font-medium text-green-700">
                            Selected: {selectedAgrogreenInsurances.length} Agrogreen insurance policy(ies)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Warehouse Owner Insurance Selection */}
              {formData.insuranceTakenBy === 'warehouse owner' && warehouseInsuranceData.length > 0 && (
                <div className="md:col-span-2">
                  <div className="space-y-2">
                    <Label className="text-orange-600 font-medium">Select Warehouse Owner Insurance Policies</Label>
                    <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {warehouseInsuranceData.map((insurance, index) => (
                          <div key={index} className="border border-orange-300 rounded p-3 bg-white">
                            <div className="flex items-center space-x-2 mb-2">
                              <input
                                type="checkbox"
                                id={`warehouse-insurance-${index}`}
                                checked={selectedWarehouseInsurances.some(selected => 
                                  selected.firePolicyNumber === insurance.firePolicyNumber && 
                                  selected.burglaryPolicyNumber === insurance.burglaryPolicyNumber
                                )}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedWarehouseInsurances(prev => [...prev, insurance]);
                                    
                                    // Auto-fill form data with selected insurance (first selection fills main form)
                                    if (selectedWarehouseInsurances.length === 0) {
                                      setFormData(prev => ({
                                        ...prev,
                                        // Fire Policy Details
                                        firePolicyCompanyName: insurance.firePolicyCompanyName || '',
                                        firePolicyNumber: insurance.firePolicyNumber || '',
                                        firePolicyAmount: insurance.firePolicyAmount || '',
                                        firePolicyStartDate: safeCreateDate(insurance.firePolicyStartDate),
                                        firePolicyEndDate: safeCreateDate(insurance.firePolicyEndDate),
                                        // Burglary Policy Details
                                        burglaryPolicyCompanyName: insurance.burglaryPolicyCompanyName || '',
                                        burglaryPolicyNumber: insurance.burglaryPolicyNumber || '',
                                        burglaryPolicyAmount: insurance.burglaryPolicyAmount || '',
                                        burglaryPolicyStartDate: safeCreateDate(insurance.burglaryPolicyStartDate),
                                        burglaryPolicyEndDate: safeCreateDate(insurance.burglaryPolicyEndDate),
                                        // Remaining amounts from insurance
                                        remainingFirePolicyAmount: insurance.remainingFirePolicyAmount || '',
                                        remainingBurglaryPolicyAmount: insurance.remainingBurglaryPolicyAmount || '',
                                      }));
                                      console.log('Auto-filled form with Warehouse Owner insurance:', insurance);
                                    }
                                  } else {
                                    setSelectedWarehouseInsurances(prev => 
                                      prev.filter(selected => 
                                        !(selected.firePolicyNumber === insurance.firePolicyNumber && 
                                          selected.burglaryPolicyNumber === insurance.burglaryPolicyNumber)
                                      )
                                    );
                                    
                                    // Clear form data if this was the insurance that filled the main form
                                    if (formData.firePolicyNumber === insurance.firePolicyNumber && 
                                        formData.burglaryPolicyNumber === insurance.burglaryPolicyNumber) {
                                      setFormData(prev => ({
                                        ...prev,
                                        // Clear Fire Policy Details
                                        firePolicyCompanyName: '',
                                        firePolicyNumber: '',
                                        firePolicyAmount: '',
                                        firePolicyStartDate: null,
                                        firePolicyEndDate: null,
                                        // Clear Burglary Policy Details
                                        burglaryPolicyCompanyName: '',
                                        burglaryPolicyNumber: '',
                                        burglaryPolicyAmount: '',
                                        burglaryPolicyStartDate: null,
                                        burglaryPolicyEndDate: null,
                                        // Clear remaining amounts
                                        remainingFirePolicyAmount: '',
                                        remainingBurglaryPolicyAmount: '',
                                      }));
                                      console.log('Cleared form data when unchecking Warehouse Owner insurance');
                                    }
                                  }
                                }}
                                className="text-orange-600"
                              />
                              <label htmlFor={`warehouse-insurance-${index}`} className="text-sm font-medium text-orange-700">
                                Warehouse Insurance {index + 1}
                              </label>
                            </div>
                            <div className="text-xs text-orange-600 space-y-1">
                              <div><strong>Insurance ID:</strong> {insurance.insuranceId || 'N/A'}</div>
                              <div><strong>Commodity:</strong> {insurance.commodity}</div>
                              <div><strong>Fire Policy:</strong> {insurance.firePolicyNumber}</div>
                              <div><strong>Burglary Policy:</strong> {insurance.burglaryPolicyNumber}</div>
                              <div><strong>Fire Amount:</strong> ₹{insurance.firePolicyAmount}</div>
                              <div><strong>Burglary Amount:</strong> ₹{insurance.burglaryPolicyAmount}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {selectedWarehouseInsurances.length > 0 && (
                        <div className="mt-3 p-2 bg-orange-100 rounded">
                          <div className="text-sm font-medium text-orange-700">
                            Selected: {selectedWarehouseInsurances.length} warehouse insurance policy(ies)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fire Policy Section - Show for all except bank */}
            {formData.insuranceTakenBy && formData.insuranceTakenBy !== '' && formData.insuranceTakenBy !== 'bank' && (
              <>
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-green-700">Fire Policy Details</h4>
                    {formData.firePolicyNumber && (
                      (selectedClientInsurances.length > 0 && (
                        <div className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                          Auto-filled from selected client insurance
                        </div>
                      )) ||
                      (selectedAgrogreenInsurances.length > 0 && (
                        <div className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                          Auto-filled from selected Agrogreen insurance
                        </div>
                      )) ||
                      (selectedWarehouseInsurances.length > 0 && (
                        <div className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                          Auto-filled from selected warehouse insurance
                        </div>
                      ))
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firePolicyCompanyName">Fire Policy Company Name</Label>
                      <Input
                        id="firePolicyCompanyName"
                        value={formData.firePolicyCompanyName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firePolicyCompanyName: e.target.value }))}
                        className="text-orange-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="firePolicyNumber">Fire Policy Number</Label>
                      <Input
                        id="firePolicyNumber"
                        value={formData.firePolicyNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, firePolicyNumber: e.target.value }))}
                        className="text-orange-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="firePolicyAmount">Fire Policy Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <Input
                          id="firePolicyAmount"
                          type="number"
                          className="pl-10 text-orange-600"
                          value={formData.firePolicyAmount}
                          onChange={(e) => setFormData(prev => ({ ...prev, firePolicyAmount: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="remainingFirePolicyAmount">Fire Policy Remaining Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <Input
                          id="remainingFirePolicyAmount"
                          type="number"
                          className="pl-10 text-green-600"
                          value={formData.remainingFirePolicyAmount}
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Fire Policy Start Date</Label>
                      {formData.firePolicyStartDate && formData.firePolicyStartDate instanceof Date && !isNaN(formData.firePolicyStartDate.getTime()) ? (
                        <div className="p-2 bg-gray-50 rounded border text-green-700">{formatDateDDMMYYYY(formData.firePolicyStartDate)}</div>
                      ) : (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              Pick start date
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.firePolicyStartDate || undefined}
                              onSelect={(date) => setFormData(prev => ({ ...prev, firePolicyStartDate: date || null }))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Fire Policy End Date</Label>
                      {formData.firePolicyEndDate && formData.firePolicyEndDate instanceof Date && !isNaN(formData.firePolicyEndDate.getTime()) ? (
                        <div className="p-2 bg-gray-50 rounded border text-green-700">{formatDateDDMMYYYY(formData.firePolicyEndDate)}</div>
                      ) : (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              Pick end date
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.firePolicyEndDate || undefined}
                              onSelect={(date) => setFormData(prev => ({ ...prev, firePolicyEndDate: date || null }))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-green-700">Burglary Policy Details</h4>
                    {formData.burglaryPolicyNumber && (
                      (selectedClientInsurances.length > 0 && (
                        <div className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                          Auto-filled from selected client insurance
                        </div>
                      )) ||
                      (selectedAgrogreenInsurances.length > 0 && (
                        <div className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                          Auto-filled from selected Agrogreen insurance
                        </div>
                      )) ||
                      (selectedWarehouseInsurances.length > 0 && (
                        <div className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                          Auto-filled from selected warehouse insurance
                        </div>
                      ))
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="burglaryPolicyCompanyName">Burglary Policy Company Name</Label>
                      <Input
                        id="burglaryPolicyCompanyName"
                        value={formData.burglaryPolicyCompanyName}
                        onChange={(e) => setFormData(prev => ({ ...prev, burglaryPolicyCompanyName: e.target.value }))}
                        className="text-orange-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="burglaryPolicyNumber">Burglary Policy Number</Label>
                      <Input
                        id="burglaryPolicyNumber"
                        value={formData.burglaryPolicyNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, burglaryPolicyNumber: e.target.value }))}
                        className="text-orange-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="burglaryPolicyAmount">Burglary Policy Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <Input
                          id="burglaryPolicyAmount"
                          type="number"
                          className="pl-10 text-orange-600"
                          value={formData.burglaryPolicyAmount}
                          onChange={(e) => setFormData(prev => ({ ...prev, burglaryPolicyAmount: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="remainingBurglaryPolicyAmount">Burglary Policy Remaining Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <Input
                          id="remainingBurglaryPolicyAmount"
                          type="number"
                          className="pl-10 text-green-600"
                          value={formData.remainingBurglaryPolicyAmount}
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Burglary Policy Start Date</Label>
                      {formData.burglaryPolicyStartDate && formData.burglaryPolicyStartDate instanceof Date && !isNaN(formData.burglaryPolicyStartDate.getTime()) ? (
                        <div className="p-2 bg-gray-50 rounded border text-green-700">{formatDateDDMMYYYY(formData.burglaryPolicyStartDate)}</div>
                      ) : (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              Pick start date
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.burglaryPolicyStartDate || undefined}
                              onSelect={(date) => setFormData(prev => ({ ...prev, burglaryPolicyStartDate: date || null }))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Burglary Policy End Date</Label>
                      {formData.burglaryPolicyEndDate && formData.burglaryPolicyEndDate instanceof Date && !isNaN(formData.burglaryPolicyEndDate.getTime()) ? (
                        <div className="p-2 bg-gray-50 rounded border text-green-700">{formatDateDDMMYYYY(formData.burglaryPolicyEndDate)}</div>
                      ) : (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              Pick end date
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.burglaryPolicyEndDate || undefined}
                              onSelect={(date) => setFormData(prev => ({ ...prev, burglaryPolicyEndDate: date || null }))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Insurance Sections */}
                {additionalInsuranceSections.map((section) => (
                  <div key={section.id}>
                    {/* Fire Policy Details - Additional Section */}
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-green-700">
                          Fire Policy Details {section.sectionNumber}
                        </h4>
                        <div className="flex items-center gap-2">
                          <div className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                            Auto-filled from: {section.insurance.insuranceId}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              // Remove this section and uncheck the insurance
                              setAdditionalInsuranceSections(prev => {
                                const newSections = prev.filter(s => s.id !== section.id);
                                // Renumber sections to maintain sequential numbering
                                return newSections.map((s, index) => ({
                                  ...s,
                                  sectionNumber: index + 2 // Starting from 2 since main form is 1
                                }));
                              });
                              setSelectedClientInsurances(prev => 
                                prev.filter(selected => 
                                  !(selected.firePolicyNumber === section.insurance.firePolicyNumber && 
                                    selected.burglaryPolicyNumber === section.insurance.burglaryPolicyNumber)
                                )
                              );
                            }}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            Remove Section
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Fire Policy Company Name</Label>
                          <div className="p-2 bg-gray-50 rounded border text-green-700">
                            {section.insurance.firePolicyCompanyName || 'N/A'}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Fire Policy Number</Label>
                          <div className="p-2 bg-gray-50 rounded border text-green-700">
                            {section.insurance.firePolicyNumber || 'N/A'}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Fire Policy Amount</Label>
                          <div className="p-2 bg-gray-50 rounded border text-green-700">
                            ₹{section.insurance.firePolicyAmount || 'N/A'}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Fire Policy Start Date</Label>
                          <div className="p-2 bg-gray-50 rounded border text-green-700">
                            {section.insurance.firePolicyStartDate ? formatDateDDMMYYYY(safeCreateDate(section.insurance.firePolicyStartDate) || new Date()) : 'N/A'}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Fire Policy End Date</Label>
                          <div className="p-2 bg-gray-50 rounded border text-green-700">
                            {section.insurance.firePolicyEndDate ? formatDateDDMMYYYY(safeCreateDate(section.insurance.firePolicyEndDate) || new Date()) : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Burglary Policy Details - Additional Section */}
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-green-700">
                          Burglary Policy Details {section.sectionNumber}
                        </h4>
                        <div className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                          Auto-filled from: {section.insurance.insuranceId}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Burglary Policy Company Name</Label>
                          <div className="p-2 bg-gray-50 rounded border text-green-700">
                            {section.insurance.burglaryPolicyCompanyName || 'N/A'}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Burglary Policy Number</Label>
                          <div className="p-2 bg-gray-50 rounded border text-green-700">
                            {section.insurance.burglaryPolicyNumber || 'N/A'}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Burglary Policy Amount</Label>
                          <div className="p-2 bg-gray-50 rounded border text-green-700">
                            ₹{section.insurance.burglaryPolicyAmount || 'N/A'}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Burglary Policy Start Date</Label>
                          <div className="p-2 bg-gray-50 rounded border text-green-700">
                            {section.insurance.burglaryPolicyStartDate ? formatDateDDMMYYYY(safeCreateDate(section.insurance.burglaryPolicyStartDate) || new Date()) : 'N/A'}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Burglary Policy End Date</Label>
                          <div className="p-2 bg-gray-50 rounded border text-green-700">
                            {section.insurance.burglaryPolicyEndDate ? formatDateDDMMYYYY(safeCreateDate(section.insurance.burglaryPolicyEndDate) || new Date()) : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Add Another Insurance Button - Only show for activated warehouses and authorized roles */}
            {formData.status === 'activated' && canAccessInsuranceFunction(formData.status || '') && (
              <div className="border-t pt-4 mt-4">
                <Button
                  type="button"
                  onClick={addInsuranceEntry}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Insurance
                </Button>
              </div>
            )}

            {/* Insurance Sections - Show existing insurance for all statuses, allow editing only for activated */}
            {formData.insuranceEntries && formData.insuranceEntries.length > 0 && formData.insuranceEntries.map((insurance: InsuranceEntry, index: number) => (
              <div key={insurance.id} className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-green-700">Additional Insurance #{index + 1}</h4>
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const status = getInsuranceAlertStatus(insurance);
                      if (status === 'expiring') {
                        return (
                          <span className="ml-2" title="Policy expiring soon">
                            <svg className="blinking-red" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <ellipse cx="16" cy="28" rx="10" ry="4" fill="#B0BEC5"/>
                              <polygon points="16,4 18.5,13 28,13 20,18 22.5,27 16,21.5 9.5,27 12,18 4,13 13.5,13" fill="#FF5252" stroke="#FF8A65" strokeWidth="1.5"/>
                              <polygon points="16,7 17.5,13 23,13 18,16 19.5,22 16,18.5 12.5,22 14,16 9,13 14.5,13" fill="#FFE0B2"/>
                            </svg>
                          </span>
                        );
                      }
                      if (status === 'expired') {
                        return (
                          <>
                            <span className="ml-2" title="Policy expired">
                              <svg className="blinking-orange" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <ellipse cx="16" cy="28" rx="10" ry="4" fill="#B0BEC5"/>
                                <polygon points="16,4 18.5,13 28,13 20,18 22.5,27 16,21.5 9.5,27 12,18 4,13 13.5,13" fill="#FF9800" stroke="#FFB300" strokeWidth="1.5"/>
                                <polygon points="16,7 17.5,13 23,13 18,16 19.5,22 16,18.5 12.5,22 14,16 9,13 14.5,13" fill="#FFE0B2"/>
                              </svg>
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="ml-2 text-blue-600 border-blue-400 hover:bg-blue-50"
                              onClick={() => handleEditInsurance(insurance)}
                            >
                              Change
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="ml-1 text-orange-600 border-orange-400 hover:bg-orange-50"
                              title="View inwards using this insurance"
                              onClick={async () => {
                                setInsuranceToCheck(insurance);
                                setShowInsuranceUsagePopup(true);
                                // Fetch inward docs using this insurance (nested fields)
                                const inwardQuery = query(
                                  collection(db, 'inward'),
                                  where('selectedInsurance.insuranceId', '==', insurance.insuranceId),
                                  where('selectedInsurance.insuranceTakenBy', '==', insurance.insuranceTakenBy)
                                );
                                const snapshot = await getDocs(inwardQuery);
                                const usageList = snapshot.docs.map(doc => ({
                                  id: doc.id,
                                  ...doc.data()
                                }));
                                setInsuranceUsageList(usageList);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </>
                        );
                      }
                      return null;
                    })()}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeInsuranceEntry(insurance.id)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Insurance Taken By</Label>
                    <Select 
                      value={insurance.insuranceTakenBy} 
                      onValueChange={(value) => {
                        const updatedEntries = formData.insuranceEntries.map((entry: InsuranceEntry) =>
                          entry.id === insurance.id 
                            ? { ...entry, insuranceTakenBy: value, clientName: '', clientAddress: '', selectedBankName: '' }
                            : entry
                        );
                        setFormData(prev => ({ ...prev, insuranceEntries: updatedEntries }));
                      }}
                    >
                      <SelectTrigger className="text-orange-600">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="warehouse owner">Warehouse Owner</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="bank">Bank</SelectItem>
                        <SelectItem value="agrogreen">Agrogreen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Commodity</Label>
                    <Select
                      value={insurance.insuranceCommodity}
                      onValueChange={async (value) => {
                        const updatedEntries = formData.insuranceEntries.map((entry: InsuranceEntry) =>
                          entry.id === insurance.id 
                            ? { ...entry, insuranceCommodity: value }
                            : entry
                        );
                        setFormData(prev => ({ ...prev, insuranceEntries: updatedEntries }));
                        
                        // If client is already selected, re-filter insurance data based on new commodity
                        if (insurance.clientName) {
                          try {
                            const combinedInsurances = await fetchClientInsurances(insurance.clientName);
                            
                            const filteredInsurances = combinedInsurances.filter((ins: any) =>
                              ins.insuranceCommodity && ins.insuranceCommodity.toLowerCase() === value.toLowerCase()
                            );
                            
                            console.log('Re-filtered insurances for commodity:', value, filteredInsurances);
                            
                            setAdditionalInsuranceClientData(prev => ({
                              ...prev,
                              [insurance.id]: filteredInsurances.length > 0 ? filteredInsurances : combinedInsurances
                            }));
                            
                            if (filteredInsurances.length > 0) {
                              const matchingInsurance = filteredInsurances[0];
                              const updatedEntriesWithData = formData.insuranceEntries.map((entry: InsuranceEntry) =>
                                entry.id === insurance.id
                                  ? {
                                      ...entry,
                                      insuranceCommodity: value,
                                      firePolicyCompanyName: matchingInsurance.firePolicyCompanyName || '',
                                      firePolicyNumber: matchingInsurance.firePolicyNumber || '',
                                      firePolicyAmount: matchingInsurance.firePolicyAmount || '',
                                      firePolicyStartDate: safeCreateDate(matchingInsurance.firePolicyStartDate),
                                      firePolicyEndDate: safeCreateDate(matchingInsurance.firePolicyEndDate),
                                      burglaryPolicyCompanyName: matchingInsurance.burglaryPolicyCompanyName || '',
                                      burglaryPolicyNumber: matchingInsurance.burglaryPolicyNumber || '',
                                      burglaryPolicyAmount: matchingInsurance.burglaryPolicyAmount || '',
                                      burglaryPolicyStartDate: safeCreateDate(matchingInsurance.burglaryPolicyStartDate),
                                      burglaryPolicyEndDate: safeCreateDate(matchingInsurance.burglaryPolicyEndDate),
                                    }
                                  : entry
                              );
                              setFormData(prev => ({ ...prev, insuranceEntries: updatedEntriesWithData }));
                            }
                          } catch (error) {
                            console.error('Error re-filtering insurance for commodity:', error);
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="text-orange-600">
                        <SelectValue placeholder="Select commodity" />
                      </SelectTrigger>
                      <SelectContent>
                        {commoditiesData.map(commodity => (
                          <SelectItem key={commodity.id} value={commodity.commodityName}>
                            {commodity.commodityName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {/* Client fields for Client selection */}
                  {insurance.insuranceTakenBy === 'client' && (
                    <>
                      <div className="space-y-2">
                        <Label>Client Name</Label>
                        <Select 
                          value={insurance.clientName} 
                          onValueChange={async (value) => {
                            const selectedClient = clientsData.find(client => client.firmName === value);
                            const updatedEntries = formData.insuranceEntries.map((entry: InsuranceEntry) =>
                              entry.id === insurance.id 
                                ? { 
                                    ...entry, 
                                    clientName: value,
                                    clientAddress: selectedClient?.companyAddress || ''
                                  }
                                : entry
                            );
                            setFormData(prev => ({ ...prev, insuranceEntries: updatedEntries }));
                            
                            // Load client insurance data and populate the form
                            if (selectedClient) {
                              try {
                                console.log('Loading insurance data for client in Additional Insurance:', value);
                                const combinedInsurances = await fetchClientInsurances(value);
                                console.log('Combined insurance data for Additional Insurance:', combinedInsurances);
                                
                                // Filter insurances based on selected commodity if available
                                let filteredInsurances = combinedInsurances;
                                if (insurance.insuranceCommodity) {
                                  filteredInsurances = combinedInsurances.filter((ins: any) => 
                                    ins.insuranceCommodity && ins.insuranceCommodity.toLowerCase() === insurance.insuranceCommodity.toLowerCase()
                                  );
                                  console.log('Filtered insurances for commodity (Additional):', insurance.insuranceCommodity, filteredInsurances);
                                }
                                
                                // Store the filtered insurance data for this additional insurance entry
                                setAdditionalInsuranceClientData(prev => ({
                                  ...prev,
                                  [insurance.id]: filteredInsurances.length > 0 ? filteredInsurances : combinedInsurances
                                }));
                                
                                // If there's insurance data, populate the first matching insurance entry
                                const insuranceToUse = filteredInsurances.length > 0 ? filteredInsurances[0] : (combinedInsurances.length > 0 ? combinedInsurances[0] : null);
                                if (insuranceToUse) {
                                  const updatedEntriesWithInsurance = formData.insuranceEntries.map((entry: InsuranceEntry) =>
                                    entry.id === insurance.id 
                                      ? { 
                                          ...entry, 
                                          clientName: value,
                                          clientAddress: selectedClient?.companyAddress || '',
                                          insuranceCommodity: insuranceToUse.insuranceCommodity || insurance.insuranceCommodity,
                                          firePolicyCompanyName: insuranceToUse.firePolicyCompanyName || '',
                                          firePolicyNumber: insuranceToUse.firePolicyNumber || '',
                                          firePolicyAmount: insuranceToUse.firePolicyAmount || '',
                                          firePolicyStartDate: safeCreateDate(insuranceToUse.firePolicyStartDate),
                                          firePolicyEndDate: safeCreateDate(insuranceToUse.firePolicyEndDate),
                                          burglaryPolicyCompanyName: insuranceToUse.burglaryPolicyCompanyName || '',
                                          burglaryPolicyNumber: insuranceToUse.burglaryPolicyNumber || '',
                                          burglaryPolicyAmount: insuranceToUse.burglaryPolicyAmount || '',
                                          burglaryPolicyStartDate: safeCreateDate(insuranceToUse.burglaryPolicyStartDate),
                                          burglaryPolicyEndDate: safeCreateDate(insuranceToUse.burglaryPolicyEndDate),
                                        }
                                      : entry
                                  );
                                  setFormData(prev => ({ ...prev, insuranceEntries: updatedEntriesWithInsurance }));
                                  console.log('Populated Additional Insurance with client data');
                                }
                              } catch (error) {
                                console.error('Error loading client insurance data for Additional Insurance:', error);
                              }
                            } else {
                              console.log('No selected client found for Additional Insurance');
                            }
                          }}
                        >
                          <SelectTrigger className="text-orange-600">
                            <SelectValue placeholder="Select Client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clientsData.map(client => (
                              <SelectItem key={client.id} value={client.firmName}>
                                {client.firmName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Client Address</Label>
                        <Select 
                          value={insurance.clientAddress} 
                          onValueChange={(value) => {
                            const updatedEntries = formData.insuranceEntries.map((entry: InsuranceEntry) =>
                              entry.id === insurance.id 
                                ? { ...entry, clientAddress: value }
                                : entry
                            );
                            setFormData(prev => ({ ...prev, insuranceEntries: updatedEntries }));
                          }}
                        >
                          <SelectTrigger className="text-orange-600">
                            <SelectValue placeholder="Select Address" />
                          </SelectTrigger>
                          <SelectContent>
                            {clientsData
                              .filter(client => insurance.clientName ? client.firmName === insurance.clientName : true)
                              .map(client => (
                                <SelectItem key={client.id} value={client.companyAddress}>
                                  {client.companyAddress}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>


                    </>
                  )}

                  {/* Bank field for Bank selection */}
                  {insurance.insuranceTakenBy === 'bank' && (
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Select 
                        value={insurance.selectedBankName} 
                        onValueChange={(value) => {
                          const updatedEntries = formData.insuranceEntries.map((entry: InsuranceEntry) =>
                            entry.id === insurance.id 
                              ? { ...entry, selectedBankName: value }
                              : entry
                          );
                          setFormData(prev => ({ ...prev, insuranceEntries: updatedEntries }));
                        }}
                      >
                        <SelectTrigger className="text-orange-600">
                          <SelectValue placeholder="Select Bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {insuranceBanks.map((bank, bankIndex) => (
                            <SelectItem key={bankIndex} value={bank.name}>
                              {bank.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Fire Policy Section - Show for all except bank */}
                {insurance.insuranceTakenBy && insurance.insuranceTakenBy !== '' && insurance.insuranceTakenBy !== 'bank' && (
                  <>
                    <div className="border-t pt-4 mt-4">
                      <h5 className="text-md font-medium text-green-700 mb-4">Fire Policy Details</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Fire Policy Company Name</Label>
                          <Input
                            value={insurance.firePolicyCompanyName}
                            onChange={(e) => {
                              const updatedEntries = formData.insuranceEntries.map((entry: InsuranceEntry) =>
                                entry.id === insurance.id 
                                  ? { ...entry, firePolicyCompanyName: e.target.value }
                                  : entry
                              );
                              setFormData(prev => ({ ...prev, insuranceEntries: updatedEntries }));
                            }}
                            className="text-orange-600"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Fire Policy Number</Label>
                          <Input
                            value={insurance.firePolicyNumber}
                            onChange={(e) => {
                              const updatedEntries = formData.insuranceEntries.map((entry: InsuranceEntry) =>
                                entry.id === insurance.id 
                                  ? { ...entry, firePolicyNumber: e.target.value }
                                  : entry
                              );
                              setFormData(prev => ({ ...prev, insuranceEntries: updatedEntries }));
                            }}
                            className="text-orange-600"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Fire Policy Amount</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                            <Input
                              type="number"
                              className="pl-10 text-orange-600"
                              value={insurance.firePolicyAmount}
                              onChange={(e) => {
                                const updatedEntries = formData.insuranceEntries.map((entry: InsuranceEntry) =>
                                  entry.id === insurance.id 
                                    ? { ...entry, firePolicyAmount: e.target.value }
                                    : entry
                                );
                                setFormData(prev => ({ ...prev, insuranceEntries: updatedEntries }));
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Fire Policy Start Date</Label>
                          {insurance.firePolicyStartDate && insurance.firePolicyStartDate instanceof Date && !isNaN(insurance.firePolicyStartDate.getTime()) ? (
                            <div className="p-2 bg-gray-50 rounded border text-green-700">{formatDateDDMMYYYY(insurance.firePolicyStartDate)}</div>
                          ) : (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  Pick start date
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={(typeof insurance.firePolicyStartDate === 'string' ? safeCreateDate(insurance.firePolicyStartDate) : insurance.firePolicyStartDate) || undefined}
                                  onSelect={(date) => {
                                    const updatedEntries = formData.insuranceEntries.map((entry: InsuranceEntry) =>
                                      entry.id === insurance.id 
                                        ? { ...entry, firePolicyStartDate: date || null }
                                        : entry
                                    );
                                    setFormData(prev => ({ ...prev, insuranceEntries: updatedEntries }));
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Fire Policy End Date</Label>
                          {insurance.firePolicyEndDate && insurance.firePolicyEndDate instanceof Date && !isNaN(insurance.firePolicyEndDate.getTime()) ? (
                            <div className="p-2 bg-gray-50 rounded border text-green-700">{formatDateDDMMYYYY(insurance.firePolicyEndDate)}</div>
                          ) : (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  Pick end date
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={(typeof insurance.firePolicyEndDate === 'string' ? safeCreateDate(insurance.firePolicyEndDate) : insurance.firePolicyEndDate) || undefined}
                                  onSelect={(date) => {
                                    const updatedEntries = formData.insuranceEntries.map((entry: InsuranceEntry) =>
                                      entry.id === insurance.id 
                                        ? { ...entry, firePolicyEndDate: date || null }
                                        : entry
                                    );
                                    setFormData(prev => ({ ...prev, insuranceEntries: updatedEntries }));
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h5 className="text-md font-medium text-green-700 mb-4">Burglary Policy Details</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Burglary Policy Company Name</Label>
                          <Input
                            value={insurance.burglaryPolicyCompanyName}
                            onChange={(e) => {
                              const updatedEntries = formData.insuranceEntries.map((entry: InsuranceEntry) =>
                                entry.id === insurance.id 
                                  ? { ...entry, burglaryPolicyCompanyName: e.target.value }
                                  : entry
                              );
                              setFormData(prev => ({ ...prev, insuranceEntries: updatedEntries }));
                            }}
                            className="text-orange-600"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Burglary Policy Number</Label>
                          <Input
                            value={insurance.burglaryPolicyNumber}
                            onChange={(e) => {
                              const updatedEntries = formData.insuranceEntries.map((entry: InsuranceEntry) =>
                                entry.id === insurance.id 
                                  ? { ...entry, burglaryPolicyNumber: e.target.value }
                                  : entry
                              );
                              setFormData(prev => ({ ...prev, insuranceEntries: updatedEntries }));
                            }}
                            className="text-orange-600"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Burglary Policy Amount</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                            <Input
                              type="number"
                              className="pl-10 text-orange-600"
                              value={insurance.burglaryPolicyAmount}
                              onChange={(e) => {
                                const updatedEntries = formData.insuranceEntries.map((entry: InsuranceEntry) =>
                                  entry.id === insurance.id 
                                    ? { ...entry, burglaryPolicyAmount: e.target.value }
                                    : entry
                                );
                                setFormData(prev => ({ ...prev, insuranceEntries: updatedEntries }));
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Burglary Policy Start Date</Label>
                          {insurance.burglaryPolicyStartDate && insurance.burglaryPolicyStartDate instanceof Date && !isNaN(insurance.burglaryPolicyStartDate.getTime()) ? (
                            <div className="p-2 bg-gray-50 rounded border text-green-700">{formatDateDDMMYYYY(insurance.burglaryPolicyStartDate)}</div>
                          ) : (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  Pick start date
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={(typeof insurance.burglaryPolicyStartDate === 'string' ? safeCreateDate(insurance.burglaryPolicyStartDate) : insurance.burglaryPolicyStartDate) || undefined}
                                  onSelect={(date) => {
                                    const updatedEntries = formData.insuranceEntries.map((entry: InsuranceEntry) =>
                                      entry.id === insurance.id 
                                        ? { ...entry, burglaryPolicyStartDate: date || null }
                                        : entry
                                    );
                                    setFormData(prev => ({ ...prev, insuranceEntries: updatedEntries }));
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Burglary Policy End Date</Label>
                          {insurance.burglaryPolicyEndDate && insurance.burglaryPolicyEndDate instanceof Date && !isNaN(insurance.burglaryPolicyEndDate.getTime()) ? (
                            <div className="p-2 bg-gray-50 rounded border text-green-700">{formatDateDDMMYYYY(insurance.burglaryPolicyEndDate)}</div>
                          ) : (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  Pick end date
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={(typeof insurance.burglaryPolicyEndDate === 'string' ? safeCreateDate(insurance.burglaryPolicyEndDate) : insurance.burglaryPolicyEndDate) || undefined}
                                  onSelect={(date) => {
                                    const updatedEntries = formData.insuranceEntries.map((entry: InsuranceEntry) =>
                                      entry.id === insurance.id 
                                        ? { ...entry, burglaryPolicyEndDate: date || null }
                                        : entry
                                    );
                                    setFormData(prev => ({ ...prev, insuranceEntries: updatedEntries }));
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </CardContent>
          )}
        </Card>

        {/* Security at Warehouse */}
        <Card className="border-green-300">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-green-700">Security at Warehouse</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="securityAvailable">Security Available <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.securityAvailable}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, securityAvailable: value }))}
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="yes" className="text-orange-600" style={{ color: "#ea580c" }}>Yes</SelectItem>
                    <SelectItem value="no" className="text-orange-600" style={{ color: "#ea580c" }}>No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.securityAvailable === 'yes' && (
                <div className="space-y-2">
                  <Label htmlFor="typeOfSecurity">Type of Security <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.typeOfSecurity}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, typeOfSecurity: value }))}
                  >
                    <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                      <SelectValue placeholder="Select Type" className="text-orange-600" style={{ color: "#ea580c" }} />
                    </SelectTrigger>
                    <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                      <SelectItem value="agrogreen" className="text-orange-600" style={{ color: "#ea580c" }}>Agrogreen</SelectItem>
                      <SelectItem value="warehouse owner" className="text-orange-600" style={{ color: "#ea580c" }}>Warehouse Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {formData.securityAvailable === 'yes' && (
              <div className="space-y-2">
                <Label htmlFor="securityGuard">Security Guard <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.securityGuard}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, securityGuard: value }))}
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="day" className="text-orange-600" style={{ color: "#ea580c" }}>Day</SelectItem>
                    <SelectItem value="night" className="text-orange-600" style={{ color: "#ea580c" }}>Night</SelectItem>
                    <SelectItem value="both" className="text-orange-600" style={{ color: "#ea580c" }}>Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inside the Warehouse */}
        <Card className="border-green-300">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-green-700">Inside the Warehouse</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stackingDone">Any Stacking Already Done <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.stackingDone}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, stackingDone: value }))}
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="yes" className="text-orange-600" style={{ color: "#ea580c" }}>Yes</SelectItem>
                    <SelectItem value="no" className="text-orange-600" style={{ color: "#ea580c" }}>No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.stackingDone === 'yes' && (
                <div className="space-y-2">
                  <Label htmlFor="commodityStored">Commodity Stored <span className="text-red-500">*</span></Label>
                  <Input
                    id="commodityStored"
                    value={formData.commodityStored}
                    onChange={(e) => setFormData(prev => ({ ...prev, commodityStored: e.target.value }))}
                  className="text-orange-600"
                  required
                />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dunnageUsed">If Dunnage is Used <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.dunnageUsed}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, dunnageUsed: value }))}
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="yes" className="text-orange-600" style={{ color: "#ea580c" }}>Yes</SelectItem>
                    <SelectItem value="no" className="text-orange-600" style={{ color: "#ea580c" }}>No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.dunnageUsed === 'yes' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="numberOfBags">Number of Bags <span className="text-red-500">*</span></Label>
                    <Input
                      id="numberOfBags"
                      type="number"
                      value={formData.numberOfBags}
                      onChange={(e) => setFormData(prev => ({ ...prev, numberOfBags: e.target.value }))}
                      className="text-orange-600"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weightInMT">Weight in MT <span className="text-red-500">*</span></Label>
                    <Input
                      id="weightInMT"
                      type="number"
                      step="0.01"
                      value={formData.weightInMT}
                      onChange={(e) => setFormData(prev => ({ ...prev, weightInMT: e.target.value }))}
                      className="text-orange-600"
                      required
                    />
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stockCountable">Whether the Stock is Countable <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.stockCountable}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, stockCountable: value }))}
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="yes" className="text-orange-600" style={{ color: "#ea580c" }}>Yes</SelectItem>
                    <SelectItem value="no" className="text-orange-600" style={{ color: "#ea580c" }}>No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherBanksCargo">Any Other Banks Cargo Stored in Same Warehouse <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.otherBanksCargo}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, otherBanksCargo: value }))}
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="yes" className="text-orange-600" style={{ color: "#ea580c" }}>Yes</SelectItem>
                    <SelectItem value="no" className="text-orange-600" style={{ color: "#ea580c" }}>No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.otherBanksCargo === 'yes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Name of Bank(s)</Label>
                  <Button type="button" onClick={addBankName} size="sm" className="bg-green-500 hover:bg-green-600">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Bank
                  </Button>
                </div>
                {formData.nameOfBank.map((bank: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={bank}
                      onChange={(e) => updateBankName(index, e.target.value)}
                      placeholder="Enter bank name"
                      className="flex-1 text-orange-600"
                    />
                    <Button
                      type="button"
                      onClick={() => removeBankName(index)}
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="otherCollateralManager">Any Other Collateral Manager Working in Same Warehouse <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.otherCollateralManager}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, otherCollateralManager: value }))}
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="yes" className="text-orange-600" style={{ color: "#ea580c" }}>Yes</SelectItem>
                    <SelectItem value="no" className="text-orange-600" style={{ color: "#ea580c" }}>No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.otherCollateralManager === 'yes' && (
                <div className="space-y-2">
                  <Label htmlFor="nameOfManager">Name of the Manager <span className="text-red-500">*</span></Label>
                  <Input
                    id="nameOfManager"
                    value={formData.nameOfManager}
                    onChange={(e) => setFormData(prev => ({ ...prev, nameOfManager: e.target.value }))}
                  className="text-orange-600"
                  required
                />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plan for Stocking of Commodity */}
        <Card className="border-green-300">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-green-700">Plan for Stocking of Commodity</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commodity">Commodity <span className="text-red-500">*</span></Label>
                <Input
                  id="commodity"
                  value={formData.commodity}
                  onChange={(e) => setFormData(prev => ({ ...prev, commodity: e.target.value }))}
                  className="text-orange-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity (MT) <span className="text-red-500">*</span></Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  className="text-orange-600"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warehouse Upkeep */}
        <Card className="border-green-300">
          <CollapsibleCardHeader 
            title="Warehouse Upkeep" 
            sectionName="warehouseUpkeep" 
          />
          {!collapsedSections.warehouseUpkeep && (
            <CardContent className="p-6 space-y-4 transition-all duration-200 ease-in-out">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dividedIntoChambers">Whether Warehouse is Divided into Chambers or Partitions <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.dividedIntoChambers}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, dividedIntoChambers: value }))}
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="yes" className="text-orange-600" style={{ color: "#ea580c" }}>Yes</SelectItem>
                    <SelectItem value="no" className="text-orange-600" style={{ color: "#ea580c" }}>No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.dividedIntoChambers === 'yes' && (
                <div className="space-y-2">
                  <Label htmlFor="howManyChambers">How Many Chambers <span className="text-red-500">*</span></Label>
                  <Input
                    id="howManyChambers"
                    type="number"
                    value={formData.howManyChambers}
                    onChange={(e) => setFormData(prev => ({ ...prev, howManyChambers: e.target.value }))}
                  className="text-orange-600"
                  required
                />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usingStackCards">Whether Using Stack Cards <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.usingStackCards}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, usingStackCards: value }))}
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="yes" className="text-orange-600" style={{ color: "#ea580c" }}>Yes</SelectItem>
                    <SelectItem value="no" className="text-orange-600" style={{ color: "#ea580c" }}>No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintainingRegisters">Whether Maintaining Registers at Warehouse <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.maintainingRegisters}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, maintainingRegisters: value }))}
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="yes" className="text-orange-600" style={{ color: "#ea580c" }}>Yes</SelectItem>
                    <SelectItem value="no" className="text-orange-600" style={{ color: "#ea580c" }}>No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fireFightingEquipments">Whether Fire Fighting Equipments Available <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.fireFightingEquipments}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, fireFightingEquipments: value }))}
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="yes" className="text-orange-600" style={{ color: "#ea580c" }}>Yes</SelectItem>
                    <SelectItem value="no" className="text-orange-600" style={{ color: "#ea580c" }}>No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.fireFightingEquipments === 'yes' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="numberOfExtinguishers">Number of Extinguishers <span className="text-red-500">*</span></Label>
                    <Input
                      id="numberOfExtinguishers"
                      type="number"
                      value={formData.numberOfExtinguishers}
                      onChange={(e) => setFormData(prev => ({ ...prev, numberOfExtinguishers: e.target.value }))}
                      className="text-orange-600"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Expiry Date <span className="text-red-500">*</span></Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.expiryDate && formData.expiryDate instanceof Date && !isNaN(formData.expiryDate.getTime()) ? format(formData.expiryDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.expiryDate || undefined}
                          onSelect={(date) => setFormData(prev => ({ ...prev, expiryDate: date || null }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weighbridgeFacility">Whether Weighbridge Facility Available at Warehouse <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.weighbridgeFacility}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, weighbridgeFacility: value }))}
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="yes" className="text-orange-600" style={{ color: "#ea580c" }}>Yes</SelectItem>
                    <SelectItem value="no" className="text-orange-600" style={{ color: "#ea580c" }}>No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.weighbridgeFacility === 'yes' ? (
                <div className="space-y-2">
                  <Label htmlFor="weighbridgeType">Weighbridge Type <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.weighbridgeType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, weighbridgeType: value }))}
                  >
                    <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                      <SelectValue placeholder="Select Type" className="text-orange-600" style={{ color: "#ea580c" }} />
                    </SelectTrigger>
                    <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                      <SelectItem value="electronic" className="text-orange-600" style={{ color: "#ea580c" }}>Electronic</SelectItem>
                      <SelectItem value="manual" className="text-orange-600" style={{ color: "#ea580c" }}>Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="distanceToWeighbridge">How Far is Weighbridge from Warehouse (km) <span className="text-red-500">*</span></Label>
                  <Input
                    id="distanceToWeighbridge"
                    type="number"
                    step="0.01"
                    value={formData.distanceToWeighbridge}
                    onChange={(e) => setFormData(prev => ({ ...prev, distanceToWeighbridge: e.target.value }))}
                    className="text-orange-600"
                    required
                />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="distanceToPoliceStation">Distance to Nearest Police Station (km) <span className="text-red-500">*</span></Label>
                <Input
                  id="distanceToPoliceStation"
                  type="number"
                  step="0.01"
                  value={formData.distanceToPoliceStation}
                  onChange={(e) => setFormData(prev => ({ ...prev, distanceToPoliceStation: e.target.value }))}
                  className="text-orange-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="distanceToFireStation">Distance to Nearest Fire Station (km) <span className="text-red-500">*</span></Label>
                <Input
                  id="distanceToFireStation"
                  type="number"
                  step="0.01"
                  value={formData.distanceToFireStation}
                  onChange={(e) => setFormData(prev => ({ ...prev, distanceToFireStation: e.target.value }))}
                  className="text-orange-600"
                  required
                />
              </div>
            </div>
          </CardContent>
          )}
        </Card>

        {/* Other Details */}
        <Card className="border-green-300">
          <CollapsibleCardHeader 
            title="Other Details" 
            sectionName="otherDetails" 
          />
          {!collapsedSections.otherDetails && (
            <CardContent className="p-6 space-y-4 transition-all duration-200 ease-in-out">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="riskOfCargoAffected">Any Risk of Cargo Getting Affected <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.riskOfCargoAffected}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, riskOfCargoAffected: value }))}
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="yes" className="text-orange-600" style={{ color: "#ea580c" }}>Yes</SelectItem>
                    <SelectItem value="no" className="text-orange-600" style={{ color: "#ea580c" }}>No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duringMonsoon">During Monsoon <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.duringMonsoon}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, duringMonsoon: value }))}
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="yes" className="text-orange-600" style={{ color: "#ea580c" }}>Yes</SelectItem>
                    <SelectItem value="no" className="text-orange-600" style={{ color: "#ea580c" }}>No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.duringMonsoon === 'yes' && (
              <div className="space-y-2">
                <Label htmlFor="monsoonRisk">Monsoon Risk <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.monsoonRisk}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, monsoonRisk: value }))}
                >
                  <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectValue placeholder="Select Risk Type" className="text-orange-600" style={{ color: "#ea580c" }} />
                  </SelectTrigger>
                  <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                    <SelectItem value="flood" className="text-orange-600" style={{ color: "#ea580c" }}>Flood</SelectItem>
                    <SelectItem value="heavy rain" className="text-orange-600" style={{ color: "#ea580c" }}>Heavy Rain</SelectItem>
                    <SelectItem value="storm" className="text-orange-600" style={{ color: "#ea580c" }}>Storm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
          )}
        </Card>

        {/* Insurance Claim History */}
        <Card className="border-green-300">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-green-700">Insurance Claim Theft/Fraud/Shortage/Fire History (3 Years)</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="insuranceClaimHistory">Insurance Claim History <span className="text-red-500">*</span></Label>
              <Select
                value={formData.insuranceClaimHistory}
                onValueChange={(value) => setFormData(prev => ({ ...prev, insuranceClaimHistory: value }))}
              >
                <SelectTrigger className="text-orange-600" style={{ color: "#ea580c" }}>
                  <SelectValue placeholder="Select" className="text-orange-600" style={{ color: "#ea580c" }} />
                </SelectTrigger>
                <SelectContent className="text-orange-600" style={{ color: "#ea580c" }}>
                  <SelectItem value="yes" className="text-orange-600" style={{ color: "#ea580c" }}>Yes</SelectItem>
                  <SelectItem value="no" className="text-orange-600" style={{ color: "#ea580c" }}>No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.insuranceClaimHistory === 'yes' && (
              <div className="space-y-2">
                <Label htmlFor="claimRemarks">Remarks <span className="text-red-500">*</span></Label>
                <Textarea
                  id="claimRemarks"
                  value={formData.claimRemarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, claimRemarks: e.target.value }))}
                  className="text-orange-600"
                  required
                  rows={4}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* OE Details */}
        <Card className="border-green-300">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-green-700">Operational Executive Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nameOfOE">Name of Operational Executive <span className="text-red-500">*</span></Label>
                <Input
                  id="nameOfOE"
                  value={formData.nameOfOE}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameOfOE: e.target.value }))}
                  className="text-orange-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Date <span className="text-red-500">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                                              {formData.oeDate && formData.oeDate instanceof Date && !isNaN(formData.oeDate.getTime()) ? format(formData.oeDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.oeDate || undefined}
                      onSelect={(date) => setFormData(prev => ({ ...prev, oeDate: date || null }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number <span className="text-red-500">*</span></Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                    if (value.length <= 10) {
                      setFormData(prev => ({ ...prev, contactNumber: value }));
                    }
                  }}
                  pattern="[0-9]{10}"
                  maxLength={10}
                  placeholder="Enter 10-digit contact number"
                  className="text-orange-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="place">Place <span className="text-red-500">*</span></Label>
                <Input
                  id="place"
                  value={formData.place}
                  onChange={(e) => setFormData(prev => ({ ...prev, place: e.target.value }))}
                  className="text-orange-600"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="attachedFiles">Attach Relevant Files</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                {!isFieldReadOnly('attachedFiles') && (
                  <div className="mt-4">
                    <input
                      type="file"
                      id="fileInput"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <label 
                      htmlFor="fileInput"
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Files
                    </label>
                  </div>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  Upload relevant documents, images, or certificates
                </p>
                
                {/* File Count Display */}
                <div className="mt-3 flex items-center justify-center text-sm">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                    {formData.attachedFiles.length} file(s) attached
                  </span>
                </div>
                
                {/* Attached Files List */}
                {formData.attachedFiles.length > 0 && (
                  <div className="mt-4 text-left border border-green-200 rounded-lg p-3 bg-green-50">
                    <p className="text-sm font-semibold text-green-800 mb-3 flex items-center">
                      <Upload className="w-4 h-4 mr-1" />
                      Attached Files ({formData.attachedFiles.length}):
                    </p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {formData.attachedFiles.map((file: string, index: number) => (
                        <div key={index} className="flex items-center justify-between bg-white p-2 rounded border border-green-200 shadow-sm">
                          <span className="text-sm text-gray-700 font-medium truncate mr-2">{file}</span>
                          {!isFieldReadOnly('attachedFiles') && (
                            <button
                              type="button"
                              className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full hover:bg-red-100 transition-colors"
                              onClick={() => {
                                setSelectedFiles((prev: File[]) => prev.filter((_: File, i: number) => i !== index));
                                setFormData(prev => ({
                                  ...prev,
                                  attachedFiles: prev.attachedFiles.filter((_: string, i: number) => i !== index)
                                }));
                                toast({
                                  title: "File Removed",
                                  description: `"${file}" removed successfully`,
                                });
                              }}
                              title="Remove file"
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Remarks */}
        <Card className="border-green-300">
          <CollapsibleCardHeader 
            title="Remarks" 
            sectionName="remarks" 
          />
          {!collapsedSections.remarks && (
            <CardContent className="p-6 space-y-4 transition-all duration-200 ease-in-out">
            <div className="space-y-2">
              <Label htmlFor="remarks">Additional Notes/Comments</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={isFieldReadOnly('remarks') ? undefined : (e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                readOnly={isFieldReadOnly('remarks')}
                className={isFieldReadOnly('remarks') ? "bg-gray-50 text-orange-600" : "text-orange-600"}
                placeholder="Enter any additional remarks, observations, or notes about the warehouse inspection..."
                rows={4}
              />
            </div>
          </CardContent>
          )}
        </Card>

        {/* Certification */}
        <Card className="border-green-300">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="warehouseFitCertification"
                checked={formData.warehouseFitCertification}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, warehouseFitCertification: !!checked }))}
                className="text-orange-600"
                disabled={isFieldReadOnly('warehouseFitCertification')}
                required
              />
              <Label htmlFor="warehouseFitCertification" className="text-sm">
                We Certify That Warehouse is Fit For Commodity Storage and findings given above are based on inspection and true to the best of our knowledge. <span className="text-red-500">*</span>
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons based on status and mode */}
        
        {/* Action guidance for checkers */}
        {userRole === 'checker' && formData.status && ['activated', 'closed', 'reactivate'].includes(formData.status) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-green-800 mb-2">✅ Checker Actions Available:</h4>
            <p className="text-sm text-green-700">
              {formData.status === 'activated' && 'You can Close this warehouse, Reject it, or send it for Resubmission.'}
              {formData.status === 'closed' && 'You can Reactivate this warehouse, Reject it, or send it for Resubmission.'}
              {formData.status === 'reactivate' && 'You can Approve Reactivation, Reject it, or send it for Resubmission.'}
              {canAccessInsuranceFunction(formData.status) && ' Insurance functions are also available.'}
            </p>
          </div>
        )}
        
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onClose} className="action-button">
            Cancel
          </Button>
          
          <div className="flex space-x-4">
            {/* Save button - always available for editing */}
            <Button 
              type="button" 
              className="bg-blue-500 hover:bg-blue-600 action-button"
              onClick={async () => {
                try {
                  await saveFormData();
                  toast({
                    title: "Saved",
                    description: "Changes saved successfully",
                  });
                } catch (error) {
                  console.error('Save error:', error);
                  const errorMessage = error instanceof Error ? error.message : "Failed to save changes";
                  toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive",
                  });
                }
              }}
            >
              Save Changes
            </Button>
            
            {/* PENDING state only */}
            {(formData.status === 'pending' || !formData.status || formData.status === '') && canEditSurvey(formData.status || 'pending') && (
              <Button type="submit" className="bg-green-500 hover:bg-green-600 action-button">
                Proceed to Submit
              </Button>
            )}
            
            {/* SUBMITTED state - action buttons from props */}
            {console.log('Debug: showSubmittedActions:', showSubmittedActions, 'status:', formData.status, 'onActivate:', !!onActivate)}
            {/* Temporary: Show buttons regardless of conditions for testing */}
            {showSubmittedActions && (
              <>
                <Button 
                  type="button" 
                  className="bg-green-500 hover:bg-green-600 action-button"
                  onClick={() => console.log('Activate clicked')}
                >
                  Proceed to Activate
                </Button>
                <Button 
                  type="button" 
                  variant="destructive"
                  className="action-button"
                  onClick={() => console.log('Reject clicked')}
                >
                  Reject
                </Button>
                <Button 
                  type="button" 
                  className="bg-purple-500 hover:bg-purple-600 action-button"
                  onClick={() => console.log('Resubmit clicked')}
                >
                  Request Resubmission
                </Button>
              </>
            )}
            
            {/* ACTIVATED state - Checker can close, reject, or resubmit */}
            {formData.status === 'activated' && canApproveSurvey(formData.status) && (
              <>
                <Button 
                  type="button" 
                  className="bg-red-500 hover:bg-red-600 action-button"
                  onClick={() => handleStatusAction('close')}
                >
                  Close
                </Button>
                <Button 
                  type="button" 
                  variant="destructive"
                  className="action-button"
                  onClick={() => handleStatusAction('reject')}
                >
                  Reject
                </Button>
                <Button 
                  type="button" 
                  className="bg-purple-500 hover:bg-purple-600 action-button"
                  onClick={() => handleStatusAction('resubmit')}
                >
                  Resubmit
                </Button>
              </>
            )}
            
            {/* RESUBMITTED state */}
            {formData.status === 'resubmitted' && mode === 'view' && canEditSurvey(formData.status) && (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="border-blue-500 text-blue-600 hover:bg-blue-50 action-button"
                  onClick={() => handleStatusAction('edit')}
                >
                  Edit
                </Button>
                <Button 
                  type="button" 
                  className="bg-green-500 hover:bg-green-600 action-button"
                  onClick={() => handleStatusAction('submit')}
                >
                  Submit
                </Button>
              </>
            )}
            
            {/* CLOSED state - Checker can reactivate, reject, or resubmit */}
            {formData.status === 'closed' && canApproveSurvey(formData.status) && (
              <>
                <Button 
                  type="button" 
                  className="bg-blue-500 hover:bg-blue-600 action-button"
                  onClick={() => handleStatusAction('reactivate')}
                >
                  Reactivate
                </Button>
                <Button 
                  type="button" 
                  variant="destructive"
                  className="action-button"
                  onClick={() => handleStatusAction('reject')}
                >
                  Reject
                </Button>
                <Button 
                  type="button" 
                  className="bg-purple-500 hover:bg-purple-600 action-button"
                  onClick={() => handleStatusAction('resubmit')}
                >
                  Resubmit
                </Button>
              </>
            )}
            
            {/* REACTIVATE state - Checker can approve reactivation, reject, or resubmit */}
            {formData.status === 'reactivate' && canApproveSurvey(formData.status) && (
              <>
                <Button 
                  type="button" 
                  className="bg-green-500 hover:bg-green-600 action-button"
                  onClick={() => handleStatusAction('activate')}
                >
                  Approve Reactivation
                </Button>
                <Button 
                  type="button" 
                  variant="destructive"
                  className="action-button"
                  onClick={() => handleStatusAction('reject')}
                >
                  Reject
                </Button>
                <Button 
                  type="button" 
                  className="bg-purple-500 hover:bg-purple-600 action-button"
                  onClick={() => handleStatusAction('resubmit')}
                >
                  Resubmit
                </Button>
              </>
            )}

            {/* REJECTED state - read only, no buttons */}
            {formData.status === 'rejected' && (
              <div className="text-sm text-gray-500 px-4 py-2 italic">
                Status: {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Removed Insurance Popup - using direct validation instead */}

      {/* Insurance Usage Popup */}
      <Dialog open={showInsuranceUsagePopup} onOpenChange={setShowInsuranceUsagePopup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inward Documents Using This Insurance</DialogTitle>
          </DialogHeader>
          <div>
            {insuranceUsageList.length === 0 ? (
              <div>No inward documents found using this insurance.</div>
            ) : (
              <>
                {(() => {
                  // Try to sum inward.totalValue, inward.value, or inward.amount
                  const getValue = (inward: any) => {
                    if (typeof inward.totalValue === 'number') return inward.totalValue;
                    if (typeof inward.totalValue === 'string') return parseFloat(inward.totalValue);
                    if (typeof inward.value === 'number') return inward.value;
                    if (typeof inward.value === 'string') return parseFloat(inward.value);
                    if (typeof inward.amount === 'number') return inward.amount;
                    if (typeof inward.amount === 'string') return parseFloat(inward.amount);
                    return 0;
                  };
                  const totalValue = insuranceUsageList.reduce((sum, inward) => sum + (getValue(inward) || 0), 0);
                  // Get insurance policy amounts
                  const fireAmount = parseFloat(insuranceToCheck?.firePolicyAmount || '0');
                  const burglaryAmount = parseFloat(insuranceToCheck?.burglaryPolicyAmount || '0');
                  // Format currency
                  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;
                  // Applicability logic
                  const isApplicable = totalValue < fireAmount && totalValue < burglaryAmount;
                  return (
                    <div className="mb-4 space-y-2">
                      <div><b>Total Value of Inwards:</b> {formatCurrency(totalValue)}</div>
                      <div><b>Fire Policy Amount:</b> {formatCurrency(fireAmount)}</div>
                      <div><b>Burglary Policy Amount:</b> {formatCurrency(burglaryAmount)}</div>
                      <Button
                        type="button"
                        disabled={!isApplicable}
                        className={isApplicable ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}
                      >
                        {isApplicable ? 'Applicable' : 'Not Applicable'}
                      </Button>
                    </div>
                  );
                })()}
                <ul>
                  {insuranceUsageList.map(inward => (
                    <li key={inward.id}>
                      Inward ID: <b>{inward.inwardId || '-'}</b> | Warehouse Name: <b>{inward.warehouseName || '-'}</b>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Insurance Modal */}
      <Dialog open={showEditInsuranceModal} onOpenChange={setShowEditInsuranceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Insurance Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Insurance Taken By</Label>
              <Select
                value={editInsuranceFields.insuranceTakenBy}
                onValueChange={val => {
                  setEditInsuranceFields((f: any) => ({ ...f, insuranceTakenBy: val, clientName: '', selectedPolicy: null }));
                }}
              >
                <SelectTrigger className="text-orange-600">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warehouse owner">Warehouse Owner</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="agrogreen">Agrogreen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* If client, show client name and policy select */}
            {editInsuranceFields.insuranceTakenBy === 'client' && (
              <>
                <div>
                  <Label>Client Name</Label>
                  <Select
                    value={editInsuranceFields.clientName || ''}
                    onValueChange={async val => {
                      setEditInsuranceFields((f: any) => ({ ...f, clientName: val, selectedPolicy: null }));
                      // Fetch client insurance data for the selected client
                      try {
                        const clientDoc = await getDocs(query(collection(db, 'clients'), where('firmName', '==', val)));
                        if (!clientDoc.empty) {
                          const clientData = clientDoc.docs[0].data();
                          const insurances = clientData.insurances || [];
                          setClientInsuranceData(insurances);
                        } else {
                          setClientInsuranceData([]);
                        }
                      } catch (error) {
                        setClientInsuranceData([]);
                      }
                    }}
                  >
                    <SelectTrigger className="text-orange-600">
                      <SelectValue placeholder="Select Client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientsData.map(client => (
                        <SelectItem key={client.id} value={client.firmName}>{client.firmName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Show client insurance policies if client selected */}
                {editInsuranceFields.clientName && clientInsuranceData.length > 0 && (
                  <div>
                    <Label>Select Client Insurance Policies</Label>
                    <Select
                      value={editInsuranceFields.selectedPolicy || ''}
                      onValueChange={val => {
                        const selected = clientInsuranceData.find(i => i.insuranceId === val);
                        if (selected) {
                          setEditInsuranceFields((f: any) => ({
                            ...f,
                            selectedPolicy: val,
                            insuranceCommodity: selected.commodity || '',
                            firePolicyStartDate: safeCreateDate(selected.firePolicyStartDate),
                            firePolicyEndDate: safeCreateDate(selected.firePolicyEndDate),
                            burglaryPolicyStartDate: safeCreateDate(selected.burglaryPolicyStartDate),
                            burglaryPolicyEndDate: safeCreateDate(selected.burglaryPolicyEndDate),
                            burglaryPolicyAmount: selected.burglaryPolicyAmount || '',
                            burglaryPolicyCompanyName: selected.burglaryPolicyCompanyName || '',
                            firePolicyAmount: selected.firePolicyAmount || '',
                            firePolicyCompanyName: selected.firePolicyCompanyName || '',
                            firePolicyNumber: selected.firePolicyNumber || '',
                            burglaryPolicyNumber: selected.burglaryPolicyNumber || '',
                          }));
                        }
                      }}
                    >
                      <SelectTrigger className="text-orange-600">
                        <SelectValue placeholder="Select Policy" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientInsuranceData.map(policy => (
                          <SelectItem key={policy.insuranceId} value={policy.insuranceId}>
                            {policy.insuranceId} - {policy.commodity}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
            {/* If agrogreen, show agrogreen policy select */}
            {editInsuranceFields.insuranceTakenBy === 'agrogreen' && (
              <div>
                <Label>Select Agrogreen Insurance Policies</Label>
                <Select
                  value={editInsuranceFields.selectedPolicy || ''}
                  onOpenChange={async (open) => {
                    if (open && agrogreenInsuranceData.length === 0) {
                      try {
                        const agrogreenDocs = await getDocs(collection(db, 'agrogreen'));
                        if (!agrogreenDocs.empty) {
                          const agrogreenInsurances = agrogreenDocs.docs.map(doc => ({
                            ...doc.data(),
                            insuranceId: doc.data().insuranceId || doc.id,
                            commodity: doc.data().commodity || '',
                            firePolicyStartDate: doc.data().firePolicyStartDate,
                            firePolicyEndDate: doc.data().firePolicyEndDate,
                            burglaryPolicyStartDate: doc.data().burglaryPolicyStartDate,
                            burglaryPolicyEndDate: doc.data().burglaryPolicyEndDate,
                          }));
                          setAgrogreenInsuranceData(agrogreenInsurances);
                        } else {
                          setAgrogreenInsuranceData([]);
                        }
                      } catch (error) {
                        setAgrogreenInsuranceData([]);
                      }
                    }
                  }}
                  onValueChange={val => {
                    const selected = agrogreenInsuranceData.find(i => i.insuranceId === val);
                    if (selected) {
                      setEditInsuranceFields((f: any) => ({
                        ...f,
                        selectedPolicy: val,
                        insuranceCommodity: selected.commodity || '',
                        firePolicyStartDate: safeCreateDate(selected.firePolicyStartDate),
                        firePolicyEndDate: safeCreateDate(selected.firePolicyEndDate),
                        burglaryPolicyStartDate: safeCreateDate(selected.burglaryPolicyStartDate),
                        burglaryPolicyEndDate: safeCreateDate(selected.burglaryPolicyEndDate),
                        burglaryPolicyAmount: selected.burglaryPolicyAmount || '',
                        burglaryPolicyCompanyName: selected.burglaryPolicyCompanyName || '',
                        firePolicyAmount: selected.firePolicyAmount || '',
                        firePolicyCompanyName: selected.firePolicyCompanyName || '',
                        firePolicyNumber: selected.firePolicyNumber || '',
                        burglaryPolicyNumber: selected.burglaryPolicyNumber || '',
                      }));
                    }
                  }}
                >
                  <SelectTrigger className="text-orange-600">
                    <SelectValue placeholder="Select Policy" />
                  </SelectTrigger>
                  <SelectContent>
                    {agrogreenInsuranceData.map(policy => (
                      <SelectItem key={policy.insuranceId} value={policy.insuranceId}>
                        {policy.insuranceId} - {policy.commodity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* Manual fields if not autofilled by policy selection */}
            {(!editInsuranceFields.selectedPolicy || editInsuranceFields.insuranceTakenBy === 'warehouse owner' || editInsuranceFields.insuranceTakenBy === 'bank') && (
              <>
                <div>
                  <Label>Commodity</Label>
                  <Select
                    value={editInsuranceFields.insuranceCommodity || ''}
                    onValueChange={(value) => setEditInsuranceFields((f: any) => ({ ...f, insuranceCommodity: value }))}
                  >
                    <SelectTrigger className="text-orange-600">
                      <SelectValue placeholder="Select commodity" />
                    </SelectTrigger>
                    <SelectContent>
                      {commoditiesData.map(commodity => (
                        <SelectItem key={commodity.id} value={commodity.commodityName}>
                          {commodity.commodityName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fire Policy Start Date</Label>
                  <Input
                    type="date"
                    value={editInsuranceFields.firePolicyStartDate ? format(editInsuranceFields.firePolicyStartDate, 'yyyy-MM-dd') : ''}
                    onChange={e => setEditInsuranceFields((f: any) => ({ ...f, firePolicyStartDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Fire Policy End Date</Label>
                  <Input
                    type="date"
                    value={editInsuranceFields.firePolicyEndDate ? format(editInsuranceFields.firePolicyEndDate, 'yyyy-MM-dd') : ''}
                    onChange={e => setEditInsuranceFields((f: any) => ({ ...f, firePolicyEndDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Burglary Policy Start Date</Label>
                  <Input
                    type="date"
                    value={editInsuranceFields.burglaryPolicyStartDate ? format(editInsuranceFields.burglaryPolicyStartDate, 'yyyy-MM-dd') : ''}
                    onChange={e => setEditInsuranceFields((f: any) => ({ ...f, burglaryPolicyStartDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Burglary Policy End Date</Label>
                  <Input
                    type="date"
                    value={editInsuranceFields.burglaryPolicyEndDate ? format(editInsuranceFields.burglaryPolicyEndDate, 'yyyy-MM-dd') : ''}
                    onChange={e => setEditInsuranceFields((f: any) => ({ ...f, burglaryPolicyEndDate: e.target.value }))}
                  />
                </div>
              </>
            )}
            <Button type="button" className="bg-green-600 hover:bg-green-700 text-white w-full" onClick={handleSaveEditInsurance}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 