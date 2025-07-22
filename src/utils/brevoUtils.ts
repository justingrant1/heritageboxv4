
/**
 * Utility functions for interacting with Brevo (formerly Sendinblue) API
 */

// Brevo API endpoint for sending transactional emails
const BREVO_API_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

export interface OrderData {
  orderNumber: string;
  orderDate: string;
  packageType: string;
  usbDrives: number;
  digitizingSpeed?: string;
  speedTime?: string;
  speedPrice?: number;
  total?: string;
  customerName?: string;
  customerEmail?: string;
}

/**
 * Sends order confirmation details to Brevo
 * @param customerEmail Customer's email address
 * @param customerName Customer's full name
 * @param orderData Order details
 * @returns Promise with the API response
 */
export const sendOrderConfirmationToBrevo = async (
  customerEmail: string,
  customerName: string, 
  orderData: OrderData
): Promise<Response> => {
  // For demonstration purposes, we'll log the data that would be sent
  console.log('Sending to Brevo:', {
    customerEmail,
    customerName,
    orderData
  });

  // In a real implementation, you would uncomment this code and add your Brevo API key
  /*
  return fetch(BREVO_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': 'YOUR_BREVO_API_KEY', // You should store this in Supabase secrets
    },
    body: JSON.stringify({
      sender: {
        name: "Memory Mixers",
        email: "orders@memorymixers.com"
      },
      to: [{
        email: customerEmail,
        name: customerName
      }],
      subject: `Your Memory Mixers Order Confirmation #${orderData.orderNumber}`,
      htmlContent: `
        <html>
          <body>
            <h1>Thank you for your order!</h1>
            <p>Hello ${customerName},</p>
            <p>We've received your order and are processing it. Here are your order details:</p>
            <ul>
              <li><strong>Order Number:</strong> ${orderData.orderNumber}</li>
              <li><strong>Order Date:</strong> ${orderData.orderDate}</li>
              <li><strong>Package Type:</strong> ${orderData.packageType}</li>
              <li><strong>Additional USB Drives:</strong> ${orderData.usbDrives || 0}</li>
              <li><strong>Digitizing Speed:</strong> ${orderData.digitizingSpeed || 'Standard'} (${orderData.speedTime})</li>
            </ul>
            <p>Your order will be processed according to the timeline for your selected digitizing speed.</p>
            <p>Thank you for choosing Memory Mixers!</p>
          </body>
        </html>
      `,
      params: {
        orderNumber: orderData.orderNumber,
        packageType: orderData.packageType,
        orderTotal: orderData.total
      }
    })
  });
  */

  // Return a mock successful response for now
  return new Response(JSON.stringify({ message: 'Email would be sent in production' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
