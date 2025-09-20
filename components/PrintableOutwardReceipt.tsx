import React from 'react';

export default function PrintableOutwardReceipt({ outwardData }: { outwardData: any }) {
  // CIR-style layout
  const labelStyle = {
    fontWeight: 700,
    color: '#1aad4b',
    fontSize: 16,
    marginBottom: 4,
    marginTop: 12,
    letterSpacing: 0.2,
  };
  const valueStyle = {
    fontWeight: 500,
    color: '#222',
    fontSize: 16,
    marginBottom: 8,
    background: '#f6fef9',
    borderRadius: 8,
    padding: '6px 12px',
    border: '1px solid #e0f2e9',
  };

  // All fields in three-column grid
  const fields = [
    { label: 'Outward Code', value: outwardData.outwardCode },
    { label: 'SR/WR No.', value: outwardData.srwrNo },
    { label: 'DO Code', value: outwardData.doCode },
    { label: 'CAD Number', value: outwardData.cadNumber },
    { label: 'State', value: outwardData.state },
    { label: 'Branch', value: outwardData.branch },
    { label: 'Location', value: outwardData.location },
    { label: 'Warehouse Name', value: outwardData.warehouseName },
    { label: 'Warehouse Code', value: outwardData.warehouseCode },
    { label: 'Warehouse Address', value: outwardData.warehouseAddress },
    { label: 'Client Name', value: outwardData.client },
    { label: 'Client Code', value: outwardData.clientCode },
    { label: 'Client Address', value: outwardData.clientAddress },
    { label: 'DO Bags', value: outwardData.doBags },
    { label: 'DO Quantity (MT)', value: outwardData.doQuantity },
    { label: 'Outward Bags', value: outwardData.outwardBags },
    { label: 'Outward Quantity (MT)', value: outwardData.outwardQuantity },
    { label: 'Vehicle Number', value: outwardData.vehicleNumber },
    { label: 'Gate Pass', value: outwardData.gatepass },
    { label: 'Weighbridge Name', value: outwardData.weighbridgeName },
    { label: 'Weighbridge Slip No', value: outwardData.weighbridgeSlipNo },
    { label: 'Gross Weight (MT)', value: outwardData.grossWeight },
    { label: 'Tare Weight (MT)', value: outwardData.tareWeight },
    { label: 'Net Weight (MT)', value: outwardData.netWeight },
    { label: 'Total Bags Outward', value: outwardData.totalBagsOutward },
    { label: 'Balance Bags', value: outwardData.balanceBags },
    { label: 'Balance Quantity (MT)', value: outwardData.balanceQuantity },
  ];

  return (
    <div
      style={{
        width: 900,
        margin: '24px auto',
        background: '#fff',
        borderRadius: 16,
        fontFamily: 'Arial, sans-serif',
        color: '#222',
        boxShadow: '0 4px 24px #e0f2e9',
        padding: 36,
      }}
      id="printable-outward-receipt"
    >
      {/* Header with logo and address */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <img src="/Group 86.png" alt="Agrogreen Logo" style={{ width: 90, height: 90, borderRadius: '50%', margin: '0 auto 8px' }} />
        <div style={{ fontSize: 28, fontWeight: 700, color: '#e67c1f', letterSpacing: 0.5, marginBottom: 2 }}>AGROGREEN WAREHOUSING PRIVATE LTD.</div>
        <div style={{ fontSize: 18, fontWeight: 500, color: '#1aad4b', marginBottom: 8 }}>603, 6th Floor, Princess Business Skyline, Indore, Madhya Pradesh - 452010</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#e67c1f', margin: '24px 0 0 0', textDecoration: 'underline' }}>Outward Details</div>
      </div>
      
      {/* Three-column grid for fields */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '0 24px',
          marginTop: 32,
        }}
      >
        {fields.map((f, idx) => (
          <div key={idx} style={{ marginBottom: 12 }}>
            <div style={labelStyle}>{f.label}</div>
            <div style={valueStyle}>{f.value ?? '-'}</div>
          </div>
        ))}
      </div>

      {/* Stack Entries Section */}
      {outwardData.stackEntries && outwardData.stackEntries.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1aad4b', marginBottom: 12, textAlign: 'center' }}>Stack Details</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e0f2e9', marginBottom: 16 }}>
            <thead>
              <tr style={{ backgroundColor: '#f6fef9' }}>
                <th style={{ border: '1px solid #e0f2e9', padding: '8px', color: '#1aad4b', fontWeight: 700 }}>Stack No.</th>
                <th style={{ border: '1px solid #e0f2e9', padding: '8px', color: '#1aad4b', fontWeight: 700 }}>Bags</th>
                <th style={{ border: '1px solid #e0f2e9', padding: '8px', color: '#1aad4b', fontWeight: 700 }}>Quantity (MT)</th>
              </tr>
            </thead>
            <tbody>
              {outwardData.stackEntries.map((stack: any, index: number) => (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                  <td style={{ border: '1px solid #e0f2e9', padding: '8px', textAlign: 'center' }}>{stack.stackNo}</td>
                  <td style={{ border: '1px solid #e0f2e9', padding: '8px', textAlign: 'center' }}>{stack.bags}</td>
                  <td style={{ border: '1px solid #e0f2e9', padding: '8px', textAlign: 'center' }}>{stack.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Attachments */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontWeight: 700, color: '#1aad4b', fontSize: 16, marginBottom: 4, marginTop: 12, letterSpacing: 0.2 }}>Attachment</div>
        {Array.isArray(outwardData.attachmentUrls) && outwardData.attachmentUrls.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {outwardData.attachmentUrls.map((url: string, idx: number) => {
              const ext = url.split('.').pop()?.toLowerCase();
              let label = 'View File';
              if (ext === 'pdf') label = 'View PDF';
              else if (ext === 'docx') label = 'View DOCX';
              else if (["jpg", "jpeg", "png"].includes(ext || '')) label = 'View Image';
              return (
                <a key={idx} href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#1a56db', textDecoration: 'underline', fontSize: 15 }}>
                  {label} {idx + 1}
                </a>
              );
            })}
          </div>
        ) : (
          <span style={{ color: '#888', fontSize: 15 }}>No file</span>
        )}
      </div>
      
      <div style={{ fontSize: 13, color: '#555', textAlign: 'right', marginTop: 24 }}>
        <b>Generated on:</b> {new Date().toLocaleString()}
      </div>
    </div>
  );
}
