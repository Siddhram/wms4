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
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import '../../sticky-table-styles.css';

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
    { key: 'inwardDate', label: 'Inward Date', width: 'w-28' },
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

  // Set default date range (last 6 months)
  useEffect(() => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(sixMonthsAgo.toISOString().split('T')[0]);
  }, []);

  const fetchInwardData = useCallback(async () => {
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
        // Process each inward record with cross-collection data fetching
        const processedData = await Promise.all(querySnapshot.docs.map(async (doc, index) => {
                const docData = doc.data();
                
          console.log(`Processing inward document ${index + 1}:`, doc.id);
          console.log('Available fields:', Object.keys(docData));
          
          // Debug specific field groups that are showing N/A
          console.log('🔍 DEBUG: Field Analysis for Document', doc.id);
          
          // Warehouse Type fields
          console.log('Warehouse Type fields:', {
            warehouseType: docData.warehouseType,
            typeOfWarehouse: docData.typeOfWarehouse,
            businessType: docData.businessType,
            typeOfBusiness: docData.typeOfBusiness
          });
          
          // Bank fields  
          console.log('Bank fields:', {
            bankName: docData.bankName,
            bank: docData.bank,
            selectedBankName: docData.selectedBankName,
            bankBranchName: docData.bankBranchName,
            bankBranch: docData.bankBranch,
            branchName: docData.branchName,
            selectedBankBranchName: docData.selectedBankBranchName,
            bankState: docData.bankState,
            selectedBankState: docData.selectedBankState
          });
          
          // Date fields
          console.log('Date fields:', {
            srWrDate: docData.srWrDate,
            srwrDate: docData.srwrDate,
            receiptDate: docData.receiptDate,
            fundingSrWrDate: docData.fundingSrWrDate,
            fundingDate: docData.fundingDate,
            srLastValidityDate: docData.srLastValidityDate,
            validityDate: docData.validityDate,
            expiryDate: docData.expiryDate
          });
          
          // Quantity fields
          console.log('Quantity fields:', {
            totalQty: docData.totalQty,
            quantity: docData.quantity,
            totalQuantity: docData.totalQuantity,
            weight: docData.weight,
            roBags: docData.roBags,
            roReleasedBags: docData.roReleasedBags,
            roQty: docData.roQty,
            roReleasedQty: docData.roReleasedQty,
            doBags: docData.doBags,
            doReleasedBags: docData.doReleasedBags,
            doQty: docData.doQty,
            doReleasedQty: docData.doReleasedQty,
            balanceQty: docData.balanceQty,
            remainingQty: docData.remainingQty
          });
          
          // Financial fields
          console.log('Financial fields:', {
            rate: docData.rate,
            ratePerMT: docData.ratePerMT,
            pricePerMT: docData.pricePerMT,
            aum: docData.aum,
            aumValue: docData.aumValue,
            assetValue: docData.assetValue
          });
          
          // Debug insurance field specifically
          if (docData.insuranceManagedBy || docData.selectedInsurance || docData.insurance) {
            console.log('Insurance field type and value:', {
              insuranceManagedBy: typeof docData.insuranceManagedBy,
              insuranceManagedByValue: docData.insuranceManagedBy,
              selectedInsurance: typeof docData.selectedInsurance,
              selectedInsuranceValue: docData.selectedInsurance,
              insurance: typeof docData.insurance,
              insuranceValue: docData.insurance
            });
          }
          
          // Format date properly in ISO format (2025-08-11)
          const formatDate = (dateValue: any) => {
            if (!dateValue) return '';
            
            let date: Date;
            
            // Handle Firebase Timestamp
            if (dateValue?.toDate) {
              date = dateValue.toDate();
            }
            // Handle string dates
            else if (typeof dateValue === 'string') {
              // If already in correct format, return as is
              if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                return dateValue;
              }
              date = new Date(dateValue);
            }
            // Handle Date objects
            else if (dateValue instanceof Date) {
              date = dateValue;
            }
            // Handle timestamp numbers
            else if (typeof dateValue === 'number') {
              date = new Date(dateValue);
            }
            else {
              return '';
            }
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
              return '';
            }
            
            // Return in ISO format (2025-08-11)
            return date.toISOString().split('T')[0];
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

          // Safe numeric extraction helper
          const safeNumeric = (value: any) => {
            if (!value) return '';
            if (typeof value === 'number') return String(value);
            if (typeof value === 'string') {
              const num = parseFloat(value);
              return isNaN(num) ? '' : String(num);
            }
            if (typeof value === 'object' && value !== null) {
              // Handle objects with nested values
              const keys = Object.keys(value);
              for (const key of keys) {
                if (typeof value[key] === 'number' || !isNaN(parseFloat(value[key]))) {
                  return String(value[key]);
                }
              }
            }
            return '';
          };

          // Create multiple SR/WR identifier strategies for cross-collection lookups
          const inwardId = docData.inwardId || doc.id;
          const receiptType = docData.receiptType || 'SR';
          const dateOfInward = docData.dateOfInward || docData.inwardDate || docData.date;
          
          // Strategy 1: Standard format SR-INW-047-2025-07-25
          const srwrNo1 = `${receiptType}-${inwardId}-${dateOfInward}`;
          
          // Strategy 2: Alternative format without date
          const srwrNo2 = `${receiptType}-${inwardId}`;
          
          // Strategy 3: Direct inwardId match
          const srwrNo3 = inwardId;
          
          console.log(`Searching RO/DO for inward ${inwardId} using patterns:`, {
            srwrNo1,
            srwrNo2, 
            srwrNo3
          });
          
          // Fetch related RO data using multiple search strategies
          let roData = { roBags: '', roQty: '', srWrNumber: '', srWrDate: '', fundingSrWrDate: '', srLastValidityDate: '', rate: '', aum: '', insurance: '' };
          try {
            const roCollection = collection(db, 'releaseOrders');
            let roSnapshot = null;
            
            // Try different srwrNo patterns
            for (const srwrPattern of [srwrNo1, srwrNo2, srwrNo3]) {
              const roQuery = query(roCollection, where('srwrNo', '==', srwrPattern));
              roSnapshot = await getDocs(roQuery);
              if (!roSnapshot.empty) {
                console.log(`Found RO data using pattern: ${srwrPattern}`);
                break;
              }
            }
            
            // If still no match, try searching by inwardId field directly
            if (!roSnapshot || roSnapshot.empty) {
              const roQuery = query(roCollection, where('inwardId', '==', inwardId));
              roSnapshot = await getDocs(roQuery);
              if (!roSnapshot.empty) {
                console.log(`Found RO data using inwardId: ${inwardId}`);
              }
            }
            
            if (!roSnapshot.empty) {
              // Aggregate RO data (sum all approved ROs for this inward)
              let totalRoBags = 0;
              let totalRoQty = 0;
              let latestRoDate = '';
              let latestFundingDate = '';
              let latestValidityDate = '';
              let roRate = '';
              let roAum = '';
              let roInsurance = '';
              
              roSnapshot.docs.forEach(roDoc => {
                const roDocData = roDoc.data();
                const roStatus = (roDocData.roStatus || '').toLowerCase();
                
                // Only include approved ROs in calculations
                if (roStatus === 'approved' || roStatus === 'approve') {
                  // Fix field mappings based on actual RO collection structure
                  totalRoBags += Number(roDocData.releaseBags || roDocData.totalBags || roDocData.bags || 0);
                  totalRoQty += Number(roDocData.releaseQuantity || roDocData.totalQuantity || roDocData.quantity || 0);
                  
                  // Get SR/WR number from the actual document  
                  if (!roData.srWrNumber && (roDocData.srwrNo || roDocData.srWrNumber)) {
                    roData.srWrNumber = roDocData.srwrNo || roDocData.srWrNumber;
                  }
                  
                  // Get SR/WR generation date (createdAt represents generation date)
                  if (roDocData.createdAt && roDocData.createdAt > latestRoDate) {
                    latestRoDate = roDocData.createdAt;
                  }
                  
                  // Collect rate and AUM from RO documents (use latest values)
                  if (roDocData.rate || roDocData.ratePerMT || roDocData.pricePerMT || roDocData.ratePerBag) {
                    roRate = roDocData.rate || roDocData.ratePerMT || roDocData.pricePerMT || roDocData.ratePerBag || roRate;
                  }
                  if (roDocData.aum || roDocData.aumValue || roDocData.assetValue || roDocData.aumAmount || roDocData.totalAum) {
                    roAum = roDocData.aum || roDocData.aumValue || roDocData.assetValue || roDocData.aumAmount || roDocData.totalAum || roAum;
                  }
                  
                  // Collect insurance data from RO documents
                  if (roDocData.insuranceManagedBy || roDocData.insurance || roDocData.insuranceTakenBy || roDocData.insuranceCompany) {
                    roInsurance = extractInsuranceValue(roDocData.insuranceManagedBy || roDocData.insurance || roDocData.insuranceTakenBy || roDocData.insuranceCompany) || roInsurance;
                  }
                  
                  // Funding date - if bank details present, use same as generation date
                  const bankDetailsPresent = roDocData.bankName || roDocData.bankBranch || roDocData.ifscCode;
                  if (bankDetailsPresent && roDocData.createdAt && roDocData.createdAt > latestFundingDate) {
                    latestFundingDate = roDocData.createdAt; // Same as SR generation date when bank details present
                  } else if (roDocData.fundingDate && roDocData.fundingDate > latestFundingDate) {
                    latestFundingDate = roDocData.fundingDate;
                  }
                  
                  // Stock validity last date
                  if (roDocData.validityDate && roDocData.validityDate > latestValidityDate) {
                    latestValidityDate = roDocData.validityDate;
                  } else if (roDocData.stockValidityLastDate && roDocData.stockValidityLastDate > latestValidityDate) {
                    latestValidityDate = roDocData.stockValidityLastDate;
                  }
                }
              });
              
              roData = {
                roBags: totalRoBags > 0 ? totalRoBags.toString() : '',
                roQty: totalRoQty > 0 ? totalRoQty.toString() : '',
                // SR/WR date parameter should fetch from SR/WR report with "SR generation date for SR" or "WR generation date for WR"
                srWrDate: latestRoDate ? formatDate(latestRoDate) : '',
                // Funding SR/WR date should be same as SR/WR date if bank details present
                fundingSrWrDate: latestFundingDate ? formatDate(latestFundingDate) : (latestRoDate ? formatDate(latestRoDate) : ''),
                // SR/WR last validity date from "Stock validity last date" parameter
                srLastValidityDate: latestValidityDate ? formatDate(latestValidityDate) : '',
                // SR/WR Number from "SR Number for SR" or "WR number for WR" parameter - preserve existing value
                srWrNumber: roData.srWrNumber,
                rate: roRate || '',
                aum: roAum || '',
                insurance: roInsurance || ''
              };
              
              console.log(`Found RO data for inward ${inwardId}:`, roData);
            }
          } catch (error) {
            console.error(`Error fetching RO data for inward ${inwardId}:`, error);
          }
          
          // Fetch related DO data using multiple search strategies  
          let doData = { doBags: '', doQty: '' };
          try {
            const doCollection = collection(db, 'deliveryOrders');
            let doSnapshot = null;
            
            // Try different srwrNo patterns
            for (const srwrPattern of [srwrNo1, srwrNo2, srwrNo3]) {
              const doQuery = query(doCollection, where('srwrNo', '==', srwrPattern));
              doSnapshot = await getDocs(doQuery);
              if (!doSnapshot.empty) {
                console.log(`Found DO data using pattern: ${srwrPattern}`);
                break;
              }
            }
            
            // If still no match, try searching by inwardId field directly
            if (!doSnapshot || doSnapshot.empty) {
              const doQuery = query(doCollection, where('inwardId', '==', inwardId));
              doSnapshot = await getDocs(doQuery);
              if (!doSnapshot.empty) {
                console.log(`Found DO data using inwardId: ${inwardId}`);
              }
            }
            
            if (!doSnapshot.empty) {
              // Aggregate DO data (sum all approved DOs for this inward)
              let totalDoBags = 0;
              let totalDoQty = 0;
              
              doSnapshot.docs.forEach(doDoc => {
                const doDocData = doDoc.data();
                const doStatus = (doDocData.doStatus || '').toLowerCase();
                
                // Only include approved DOs in calculations
                if (doStatus === 'approved' || doStatus === 'approve') {
                  // Fix field mappings based on actual DO collection structure
                  totalDoBags += Number(doDocData.doBags || doDocData.totalBags || doDocData.bags || 0);
                  totalDoQty += Number(doDocData.doQuantity || doDocData.totalQuantity || doDocData.quantity || 0);
                }
              });
              
              doData = {
                doBags: totalDoBags > 0 ? totalDoBags.toString() : '',
                doQty: totalDoQty > 0 ? totalDoQty.toString() : ''
              };
              
              console.log(`Found DO data for inward ${inwardId}:`, doData);
            }
          } catch (error) {
            console.error(`Error fetching DO data for inward ${inwardId}:`, error);
          }
          
          // Fetch bank branch name from bank master module with parameter name "Branch"
          let bankBranchFromMaster = '';
          try {
            const banksCollection = collection(db, 'banks');
            const bankQuery = query(banksCollection, where('state', '==', docData.state || docData.bankState));
            const bankSnapshot = await getDocs(bankQuery);
            
            if (!bankSnapshot.empty) {
              // Find matching bank and branch
              for (const bankDoc of bankSnapshot.docs) {
                const bankData = bankDoc.data();
                if (bankData.locations && Array.isArray(bankData.locations)) {
                  const matchingLocation = bankData.locations.find((location: any) => 
                    location.branchName === (docData.bankBranch || docData.bankBranchName) ||
                    location.locationName === (docData.bankName || docData.selectedBankName)
                  );
                  if (matchingLocation) {
                    bankBranchFromMaster = matchingLocation.branchName || '';
                    console.log(`Found bank branch from master: ${bankBranchFromMaster}`);
                    break;
                  }
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching bank branch from master for inward ${inwardId}:`, error);
          }
          
          // Calculate balance quantities
          const totalBagsNum = Number(docData.totalBags || docData.bags || 0);
          const totalQtyNum = Number(docData.totalQty || docData.quantity || docData.totalQuantity || 0);
          const roBagsNum = Number(roData.roBags || 0);
          const roQtyNum = Number(roData.roQty || 0);
          const doBagsNum = Number(doData.doBags || 0);
          const doQtyNum = Number(doData.doQty || 0);
          
          const balanceBagsCalc = Math.max(0, totalBagsNum - roBagsNum - doBagsNum);
          const balanceQtyCalc = Math.max(0, totalQtyNum - roQtyNum - doQtyNum);

          // Enhanced field mapping with cross-collection data
          return {
            id: doc.id,
            // Basic location info
            state: docData.state || docData.databaseLocation || docData.bankState || '',
            branch: docData.branch || docData.bankBranch || docData.bankBranchName || '',
            location: docData.location || docData.warehouseAddress || '',
            
            // Business info with enhanced mapping
            typeOfBusiness: docData.typeOfBusiness || docData.businessType || docData.typeOfWarehouse || '',
            warehouseType: docData.warehouseType || docData.typeOfWarehouse || docData.businessType || '',
            warehouseCode: docData.warehouseCode || '',
            warehouseName: docData.warehouseName || '',
            warehouseAddress: docData.warehouseAddress || docData.location || '',
            
            // Client info
            clientCode: docData.clientCode || docData.clientId || '',
            clientName: docData.clientName || docData.client || docData.clientDetails?.name || '',
            
            // Commodity info with enhanced extraction
            commodity: safeString(docData.commodity || docData.commodityName || docData.commodityDetails?.name),
            variety: safeString(docData.variety || docData.varietyName || docData.varietyDetails?.name),
            
            // Bank info with comprehensive fallbacks
            bankName: docData.bankName || docData.bank || docData.selectedBankName || docData.bankDetails?.name || '',
            // Bank Branch name parameter from bank master module with parameter name "Branch"
            bankBranchName: bankBranchFromMaster || docData.bankBranchName || docData.bankBranch || docData.branchName || docData.selectedBankBranchName || docData.bankDetails?.branchName || '',
            bankState: docData.bankState || docData.selectedBankState || docData.state || '',
            ifscCode: docData.ifscCode || docData.IFSC || docData.ifsc || docData.bankDetails?.ifscCode || '',
            
            // Document info
            cadNumber: docData.cadNumber || docData.cad || '',
            inwardDate: formatDate(docData.inwardDate || docData.dateOfInward || docData.date || docData.createdAt),
            
            // SR/WR info with enhanced extraction and cross-collection data
            // SR/WR number parameter should fetch from SR/WR report with "SR Number for SR" or "WR number for WR"
            srWrNumber: roData.srWrNumber || docData.srWrNumber || docData.srwrNo || docData.receiptNumber || docData.inwardId || srwrNo1 || '',
            srWrDate: roData.srWrDate || formatDate(docData.srWrDate || docData.srwrDate || docData.receiptDate || docData.inwardDate),
            fundingSrWrDate: roData.fundingSrWrDate || formatDate(docData.fundingSrWrDate || docData.fundingDate),
            srLastValidityDate: roData.srLastValidityDate || formatDate(docData.srLastValidityDate || docData.validityDate || docData.expiryDate),
            
            // Total bags and qty should be picked from inward section for that particular SR/WR number
            totalBags: safeNumeric(docData.totalBags || docData.bags || docData.noOfBags || docData.bagCount),
            totalQty: safeNumeric(docData.totalQty || docData.quantity || docData.totalQuantity || docData.weight),
            
            // Debug info for verification
            _debugInfo: {
              inwardId: inwardId,
              srwrPatterns: [srwrNo1, srwrNo2, srwrNo3],
              foundRoData: Object.keys(roData).filter(key => roData[key as keyof typeof roData] !== '').length > 0,
              foundDoData: Object.keys(doData).filter(key => doData[key as keyof typeof doData] !== '').length > 0,
              bankBranchSource: bankBranchFromMaster ? 'bankMaster' : 'inwardData'
            },
            
            // RO info from cross-collection data or fallbacks
            roBags: roData.roBags || safeNumeric(docData.roBags || docData.roReleasedBags || docData.releasedBags),
            roQty: roData.roQty || safeNumeric(docData.roQty || docData.roReleasedQty || docData.releasedQty || docData.roQuantity),
            
            // DO info from cross-collection data or fallbacks
            doBags: doData.doBags || safeNumeric(docData.doBags || docData.doReleasedBags || docData.deliveredBags),
            doQty: doData.doQty || safeNumeric(docData.doQty || docData.doReleasedQty || docData.deliveredQty || docData.doQuantity),
            
            // Balance calculation with cross-collection data
            balanceBags: safeNumeric(balanceBagsCalc || docData.balanceBags || docData.remainingBags),
            balanceQty: safeNumeric(balanceQtyCalc || docData.balanceQty || docData.remainingQty || docData.balanceQuantity),
            
            // Financial info from cross-collection data or fallbacks
            // Insurance should prioritize RO collection data if available
            insuranceManagedBy: (roData as any).insurance || extractInsuranceValue(
              docData.insuranceManagedBy || 
              docData.selectedInsurance || 
              docData.insurance || 
              docData.insuranceTakenBy ||
              docData.insuranceCompany ||
              docData.insuranceProvider
            ),
            rate: roData.rate || safeNumeric(docData.rate || docData.ratePerMT || docData.pricePerMT || docData.ratePerBag),
            aum: roData.aum || safeNumeric(docData.aum || docData.aumValue || docData.assetValue || docData.aumAmount || docData.totalAum),
            
            // Additional tracking
            databaseLocation: docData.databaseLocation || docData.state || ''
          };
        }));
        
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
  }, [startDate, endDate]);

  // Fetch inward data
  useEffect(() => {
    fetchInwardData();
  }, [fetchInwardData]);

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

  // Export filtered data to CSV - matches table display exactly
  const exportToCSV = () => {
    if (filteredData.length === 0) return;
    
    // Use only visible columns for export, matching table display
    const exportHeaders = visibleColumnsData.map(col => col.label);
    
    const csvContent = [
      exportHeaders.join(','),
      ...filteredData.map((row) => {
        return visibleColumnsData.map(column => {
          // Match the exact logic from table display
          const cellValue = row[column.key] || 'N/A';
          
          // Handle CSV escaping for values containing commas or quotes
          const cleanValue = String(cellValue);
          if (cleanValue.includes(',') || cleanValue.includes('"') || cleanValue.includes('\n')) {
            return `"${cleanValue.replace(/"/g, '""')}"`;
          }
          return cleanValue;
        }).join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
                Search: &quot;{searchTerm}&quot;
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
            <div className="table-container">
              <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-orange-100 sticky-header">
                  <tr>
                    {visibleColumnsData.map((column, index) => (
                      <th
                        key={column.key}
                        className={`border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold ${column.width} ${
                          index === 0 ? 'sticky-first-column header' : ''
                        }`}
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {visibleColumnsData.map((column, columnIndex) => {
                        const isFirstColumn = columnIndex === 0;
                        const cellValue = item[column.key] || 'N/A';
                        const isNumeric = ['totalBags', 'totalQty', 'roBags', 'roQty', 'doBags', 'doQty', 'balanceBags', 'balanceQty', 'rate', 'aum'].includes(column.key);
                        const isBold = ['warehouseName', 'clientName', 'srWrNumber'].includes(column.key);
                        
                        return (
                          <td
                            key={column.key}
                            className={`border border-gray-200 px-4 py-2 ${
                              isFirstColumn ? 'sticky-first-column' : ''
                            } ${
                              isNumeric ? 'text-right' : ''
                            } ${
                              isBold ? 'font-medium' : ''
                            }`}
                          >
                            {cellValue}
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