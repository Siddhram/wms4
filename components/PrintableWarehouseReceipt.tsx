import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PrintableWarehouseReceiptProps {
  selectedRowForSR: any;
  hologramNumber: string;
  srGenerationDate: string;
  getSelectedVarietyParticulars: () => any[];
}

const PrintableWarehouseReceipt: React.FC<PrintableWarehouseReceiptProps> = ({
  selectedRowForSR,
  hologramNumber,
  srGenerationDate,
  getSelectedVarietyParticulars
}) => {
  const particulars = getSelectedVarietyParticulars();

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto',
      backgroundColor: 'white',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      lineHeight: '1.4'
    }}>
      {/* Header Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '32px',
        marginTop: '8px'
      }}>
        <img 
          src="/Group 86.png" 
          alt="Agrogreen Logo" 
          style={{ 
            width: '120px', 
            height: '100px', 
            marginBottom: '8px', 
            borderRadius: '30%', 
            objectFit: 'cover' 
          }} 
        />
        <div style={{
          fontSize: '18px',
          fontWeight: '800',
          color: '#ea580c',
          marginTop: '8px',
          marginBottom: '8px',
          textAlign: 'center',
          letterSpacing: '0.02em'
        }}>
          AGROGREEN WAREHOUSING PRIVATE LTD.
        </div>
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#16a34a',
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          603, 6th Floor, Princess Business Skyline, Indore, Madhya Pradesh - 452010
        </div>
        <div style={{
          fontSize: '14px',
          fontWeight: '700',
          color: '#ea580c',
          textDecoration: 'underline',
          textAlign: 'center',
          marginBottom: '8px',
          letterSpacing: '0.01em'
        }}>
          {selectedRowForSR?.receiptType === 'WR' ? 'Warehouse Receipt' : 'Storage Receipt'}
        </div>
      </div>

      {/* Form Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* First Row */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              {selectedRowForSR?.receiptType === 'WR' ? 'WR No' : 'SR No'}
            </Label>
            <Input 
              value={selectedRowForSR?.srNo || `${selectedRowForSR?.receiptType === 'WR' ? 'WR' : 'SR'}-${selectedRowForSR?.inwardId || 'XXX'}-${selectedRowForSR?.dateOfInward ? selectedRowForSR.dateOfInward.replace(/-/g, '') : ''}`}
              readOnly 
              style={{ 
                backgroundColor: '#f9f9f9',
                border: '1px solid #d1d5db',
                padding: '8px 12px'
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              {selectedRowForSR?.receiptType === 'WR' ? 'WR Generation Date' : 'SR Generation Date'}
            </Label>
            <Input 
              value={srGenerationDate || 'Auto-set on Approve'} 
              readOnly
              style={{ 
                backgroundColor: '#f9f9f9',
                border: '1px solid #d1d5db',
                padding: '8px 12px'
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>CAD No</Label>
            <Input 
              value={selectedRowForSR?.cadNumber || ''} 
              readOnly
              style={{ 
                backgroundColor: '#f9f9f9',
                border: '1px solid #d1d5db',
                padding: '8px 12px'
              }}
            />
          </div>
        </div>

        {/* Date of Deposit */}
        <div>
          <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Date of deposite</Label>
          <Input 
            value={selectedRowForSR?.dateOfInward || ''} 
            readOnly
            style={{ 
              backgroundColor: '#f9f9f9',
              border: '1px solid #d1d5db',
              padding: '8px 12px',
              width: '300px'
            }}
          />
        </div>

        {/* Bank Details Section */}
        <div>
          <h3 style={{ color: '#16a34a', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
            Bank Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Bank Name</Label>
              <Input 
                value={selectedRowForSR?.bankName || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Bank Branch</Label>
              <Input 
                value={selectedRowForSR?.bankBranch || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>IFSC Code</Label>
              <Input 
                value={selectedRowForSR?.ifscCode || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Warehouse Details Section */}
        <div>
          <h3 style={{ color: '#ea580c', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
            Warehouse Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Warehouse Name</Label>
              <Input 
                value={selectedRowForSR?.warehouseName || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Warehouse Code</Label>
              <Input 
                value={selectedRowForSR?.warehouseCode || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Warehouse Address</Label>
              <Input 
                value={selectedRowForSR?.warehouseAddress || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Client Details Section */}
        <div>
          <h3 style={{ color: '#16a34a', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
            Client Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Client Name</Label>
              <Input 
                value={selectedRowForSR?.client || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Client Code</Label>
              <Input 
                value={selectedRowForSR?.clientCode || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Client Address</Label>
              <Input 
                value={selectedRowForSR?.clientAddress || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Commodity Details Section */}
        <div>
          <h3 style={{ color: '#ea580c', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
            Commodity Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Commodity</Label>
              <Input 
                value={selectedRowForSR?.commodity || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Variety</Label>
              <Input 
                value={selectedRowForSR?.varietyName || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>No. of Bags/Bales</Label>
              <Input 
                value={selectedRowForSR?.totalBags || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Total Quantity (MT)</Label>
              <Input 
                value={selectedRowForSR?.totalQuantity || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Total Value (Rs/MT)</Label>
              <Input 
                value={selectedRowForSR?.totalValue || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Market Rate (Rs/MT)</Label>
              <Input 
                value={selectedRowForSR?.marketRate || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Base Receipt Number</Label>
              <Input 
                value={selectedRowForSR?.bankReceipt || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Value of Commodities (in words)</Label>
              <Input 
                value="nine thousand nine hundred ninety only" 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Stock Validity Section */}
        <div>
          <h3 style={{ color: '#ea580c', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
            Stock Validity
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Validity Start Date</Label>
              <Input 
                value="Auto-set on Approve" 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Validity End Date</Label>
              <Input 
                value="27-07-2025" 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Hologram No</Label>
            <Input 
              value={hologramNumber || 'Enter Hologram'} 
              readOnly
              style={{ 
                backgroundColor: '#f9f9f9',
                border: '1px solid #d1d5db',
                padding: '8px 12px',
                width: '300px'
              }}
            />
          </div>
        </div>

        {/* QR Sticker Space */}
        <div style={{ 
          border: '2px dashed #d1d5db', 
          width: '200px', 
          height: '100px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: '#6b7280', 
          fontSize: '12px',
          margin: '20px auto'
        }}>
          QR Sticker Space
        </div>

        {/* Insurance Details Section */}
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: '#ea580c', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
            Insurance Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Insurance Taken By</Label>
              <Input 
                value="client" 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Commodity</Label>
              <Input 
                value="mycom" 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Client Name</Label>
              <Input 
                value={selectedRowForSR?.client || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Client Address</Label>
              <Input 
                value={selectedRowForSR?.clientAddress || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Fire Policy Company</Label>
              <Input 
                value="pol1" 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Fire Policy Number</Label>
              <Input 
                value="23456" 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Fire Policy Amount</Label>
              <Input 
                value="₹2950050.00" 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Fire Policy End Date</Label>
              <Input 
                value="27-07-2025" 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Burglary Policy Company</Label>
              <Input 
                value="pol2" 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Burglary Policy Number</Label>
              <Input 
                value="4567" 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Burglary Policy Amount</Label>
              <Input 
                value="₹1950050.00" 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Burglary Policy End Date</Label>
              <Input 
                value="27-07-2025" 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Signature Area */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'flex-end', 
          marginTop: '40px',
          marginBottom: '20px'
        }}>
          <div style={{ textAlign: 'right', marginRight: '20px' }}>
            <div style={{ 
              border: '2px dashed #d1d5db', 
              width: '200px', 
              height: '100px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#6b7280', 
              fontSize: '12px',
              marginBottom: '8px'
            }}>
              Sign/Stamp
            </div>
            <div style={{ 
              color: '#ea580c', 
              fontWeight: '700', 
              fontSize: '14px', 
              marginBottom: '8px' 
            }}>
              AGROGREEN WAREHOUSING PRIVATE LIMITED
            </div>
            <div style={{ 
              color: '#6b7280', 
              fontSize: '12px' 
            }}>
              AUTHORIZED SIGNATORY
            </div>
          </div>
        </div>



        {/* Force page break with large margin */}
        <div style={{ marginTop: '150vh' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '32px'
          }}>
            <img 
              src="/Group 86.png" 
              alt="Agrogreen Logo" 
              style={{ 
                width: '120px', 
                height: '100px', 
                marginBottom: '8px', 
                borderRadius: '30%', 
                objectFit: 'cover' 
              }} 
            />
            <div style={{
              fontSize: '18px',
              fontWeight: '800',
              color: '#ea580c',
              marginTop: '8px',
              marginBottom: '8px',
              textAlign: 'center',
              letterSpacing: '0.02em'
            }}>
              AGROGREEN WAREHOUSING PRIVATE LTD.
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#16a34a',
              marginBottom: '8px',
              textAlign: 'center'
            }}>
              603, 6th Floor, Princess Business Skyline, Indore, Madhya Pradesh - 452010
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: '700',
              color: '#ea580c',
              textDecoration: 'underline',
              textAlign: 'center',
              marginBottom: '8px',
              letterSpacing: '0.01em'
            }}>
              TEST CERTIFICATE
            </div>
          </div>

          {/* Test Certificate Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Client Name</Label>
              <Input 
                value={selectedRowForSR?.client || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Commodity Name</Label>
              <Input 
                value={selectedRowForSR?.commodity || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Commodity Variety Name</Label>
              <Input 
                value={selectedRowForSR?.varietyName || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Client Address</Label>
              <Input 
                value={selectedRowForSR?.clientAddress || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Warehouse Name</Label>
              <Input 
                value={selectedRowForSR?.warehouseName || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Warehouse Address</Label>
              <Input 
                value={selectedRowForSR?.warehouseAddress || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Total Number of Bags</Label>
              <Input 
                value={selectedRowForSR?.totalBags || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>CAD No</Label>
              <Input 
                value={selectedRowForSR?.cadNumber || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Date of Sampling</Label>
              <Input 
                value={selectedRowForSR?.dateOfSampling || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
            <div>
              <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Date of Testing</Label>
              <Input 
                value={selectedRowForSR?.dateOfTesting || ''} 
                readOnly
                style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px'
                }}
              />
            </div>
          </div>

          {/* Remarks Section */}
          <div style={{ marginBottom: '16px' }}>
            <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Remarks</Label>
            <div style={{ 
              backgroundColor: '#f9f9f9',
              border: '1px solid #d1d5db',
              padding: '8px 12px',
              minHeight: '60px',
              borderRadius: '6px'
            }}>
              Enter remarks here
            </div>
          </div>

          {/* Quality Parameters Table */}
          <div>
            <Label style={{ fontWeight: '600', marginBottom: '8px', display: 'block', color: '#16a34a' }}>
              Quality Parameters (from Commodity & Variety)
            </Label>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
              <thead>
                <tr style={{ backgroundColor: '#fef3e2' }}>
                  <th style={{ 
                    border: '1px solid #ea580c', 
                    padding: '8px', 
                    textAlign: 'center', 
                    fontWeight: '600',
                    color: '#ea580c'
                  }}>
                    Parameter
                  </th>
                  <th style={{ 
                    border: '1px solid #ea580c', 
                    padding: '8px', 
                    textAlign: 'center', 
                    fontWeight: '600',
                    color: '#ea580c'
                  }}>
                    Min %
                  </th>
                  <th style={{ 
                    border: '1px solid #ea580c', 
                    padding: '8px', 
                    textAlign: 'center', 
                    fontWeight: '600',
                    color: '#ea580c'
                  }}>
                    Max %
                  </th>
                  <th style={{ 
                    border: '1px solid #ea580c', 
                    padding: '8px', 
                    textAlign: 'center', 
                    fontWeight: '600',
                    color: '#ea580c'
                  }}>
                    Actual (%)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ 
                    border: '1px solid #ea580c', 
                    padding: '8px', 
                    textAlign: 'center' 
                  }}>
                    Moisture
                  </td>
                  <td style={{ 
                    border: '1px solid #ea580c', 
                    padding: '8px', 
                    textAlign: 'center' 
                  }}>
                    0
                  </td>
                  <td style={{ 
                    border: '1px solid #ea580c', 
                    padding: '8px', 
                    textAlign: 'center' 
                  }}>
                    15
                  </td>
                  <td style={{ 
                    border: '1px solid #ea580c', 
                    padding: '8px', 
                    textAlign: 'center' 
                  }}>
                    1
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Quality Status */}
          <div style={{ 
            textAlign: 'center', 
            color: '#16a34a', 
            fontWeight: '600', 
            marginBottom: '60px' 
          }}>
            THE QUALITY OF GOODS IS AVERAGE
          </div>

          {/* Final Signature Section and Footer - Keep Together */}
          <div style={{ 
            pageBreakInside: 'avoid', 
            breakInside: 'avoid',
            marginTop: '40px',
            minHeight: '180px',
            display: 'block'
          }}>
            {/* Final Signature Section */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              alignItems: 'flex-end'
            }}>
              <div style={{ textAlign: 'right', marginRight: '20px' }}>
                <div style={{ 
                  border: '2px dashed #d1d5db', 
                  width: '200px', 
                  height: '100px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#6b7280', 
                  fontSize: '12px',
                  marginBottom: '8px'
                }}>
                  Sign/Stamp
                </div>
                <div style={{ 
                  color: '#ea580c', 
                  fontWeight: '700', 
                  fontSize: '14px', 
                  marginBottom: '8px' 
                }}>
                  AGROGREEN WAREHOUSING PRIVATE LIMITED
                </div>
                <div style={{ 
                  color: '#6b7280', 
                  fontSize: '12px' 
                }}>
                  AUTHORIZED SIGNATORY
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ 
              marginTop: '20px', 
              padding: '10px', 
              fontSize: '11px', 
              color: '#6b7280', 
              textAlign: 'center',
              borderTop: '1px solid #d1d5db'
            }}>
              This Report is given to you on the base of best testing ability. Any discrepancy found in the report should be brought to 
              our notice within 48 hours of Receipt of the report. The above results are valid for the date and time of sampling and 
              testing only. Total liability or any claim arising out of this report is limited to the invoiced amount only.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableWarehouseReceipt; 