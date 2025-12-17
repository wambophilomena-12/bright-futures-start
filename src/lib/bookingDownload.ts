import { format } from "date-fns";

export interface BookingDownloadData {
  bookingId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  itemName: string;
  bookingType: string;
  visitDate: string;
  totalAmount: number;
  adults?: number;
  children?: number;
  slotsBooked?: number;
  paymentStatus: string;
  facilities?: Array<{ name: string; price: number }>;
  activities?: Array<{ name: string; price: number; numberOfPeople?: number }>;
}

export const generateQRCodeData = (booking: BookingDownloadData): string => {
  return JSON.stringify({
    bookingId: booking.bookingId,
    visitDate: booking.visitDate,
    email: booking.guestEmail,
  });
};

export const downloadBookingAsHTML = async (booking: BookingDownloadData, qrCodeDataUrl: string): Promise<void> => {
  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;
  
  const facilitiesHTML = booking.facilities && booking.facilities.length > 0 
    ? `
      <div class="section">
        <h3>Facilities</h3>
        <ul>
          ${booking.facilities.map(f => `<li>${f.name} - ${f.price === 0 ? 'Free' : formatCurrency(f.price)}</li>`).join('')}
        </ul>
      </div>
    ` : '';

  const activitiesHTML = booking.activities && booking.activities.length > 0 
    ? `
      <div class="section">
        <h3>Activities</h3>
        <ul>
          ${booking.activities.map(a => `<li>${a.name} - ${a.price === 0 ? 'Free' : formatCurrency(a.price)}${a.numberOfPeople ? ` (${a.numberOfPeople} people)` : ''}</li>`).join('')}
        </ul>
      </div>
    ` : '';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Booking Confirmation - ${booking.bookingId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 40px;
      background: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #008080, #006666);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 { font-size: 24px; margin-bottom: 8px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .content { padding: 30px; }
    .booking-id {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 25px;
    }
    .booking-id label { font-size: 12px; color: #666; display: block; margin-bottom: 4px; }
    .booking-id span { font-family: monospace; font-size: 14px; font-weight: bold; color: #008080; }
    .section { margin-bottom: 25px; }
    .section h3 { 
      font-size: 14px; 
      color: #666; 
      text-transform: uppercase; 
      letter-spacing: 1px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #f0f0f0;
    }
    .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .row label { color: #666; font-size: 14px; }
    .row span { font-weight: 500; font-size: 14px; }
    .total {
      background: #008080;
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .total .row { margin: 0; }
    .total label { color: rgba(255,255,255,0.8); }
    .total span { font-size: 24px; font-weight: bold; }
    .qr-section {
      text-align: center;
      padding: 30px;
      background: #f8f9fa;
    }
    .qr-section img { 
      width: 150px; 
      height: 150px;
      border: 4px solid white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .qr-section p { margin-top: 12px; font-size: 12px; color: #666; }
    .footer {
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #999;
      border-top: 1px solid #f0f0f0;
    }
    ul { list-style: none; }
    ul li { padding: 8px 0; border-bottom: 1px dashed #eee; font-size: 14px; }
    ul li:last-child { border-bottom: none; }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Booking Confirmation</h1>
      <p>Your booking has been confirmed</p>
    </div>
    
    <div class="content">
      <div class="booking-id">
        <label>Booking ID</label>
        <span>${booking.bookingId}</span>
      </div>

      <div class="section">
        <h3>Guest Information</h3>
        <div class="row">
          <label>Name</label>
          <span>${booking.guestName}</span>
        </div>
        <div class="row">
          <label>Email</label>
          <span>${booking.guestEmail}</span>
        </div>
        ${booking.guestPhone ? `
        <div class="row">
          <label>Phone</label>
          <span>${booking.guestPhone}</span>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <h3>Booking Details</h3>
        <div class="row">
          <label>Item Booked</label>
          <span>${booking.itemName}</span>
        </div>
        <div class="row">
          <label>Type</label>
          <span>${booking.bookingType.charAt(0).toUpperCase() + booking.bookingType.slice(1)}</span>
        </div>
        <div class="row">
          <label>Visit Date</label>
          <span>${format(new Date(booking.visitDate), 'PPP')}</span>
        </div>
        ${booking.slotsBooked ? `
        <div class="row">
          <label>Number of People</label>
          <span>${booking.slotsBooked}</span>
        </div>
        ` : ''}
        ${booking.adults !== undefined ? `
        <div class="row">
          <label>Adults</label>
          <span>${booking.adults}</span>
        </div>
        ` : ''}
        ${booking.children !== undefined && booking.children > 0 ? `
        <div class="row">
          <label>Children</label>
          <span>${booking.children}</span>
        </div>
        ` : ''}
        <div class="row">
          <label>Payment Status</label>
          <span style="color: ${booking.paymentStatus === 'paid' || booking.paymentStatus === 'completed' ? '#22c55e' : '#eab308'}">${booking.paymentStatus.toUpperCase()}</span>
        </div>
      </div>

      ${facilitiesHTML}
      ${activitiesHTML}

      <div class="total">
        <div class="row">
          <label>Total Amount</label>
          <span>${formatCurrency(booking.totalAmount)}</span>
        </div>
      </div>
    </div>

    <div class="qr-section">
      <img src="${qrCodeDataUrl}" alt="Booking QR Code" />
      <p>Scan this QR code at the venue</p>
    </div>

    <div class="footer">
      <p>Thank you for booking with us!</p>
      <p>Generated on ${format(new Date(), 'PPP')}</p>
    </div>
  </div>
</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `booking-${booking.bookingId.slice(0, 8)}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
