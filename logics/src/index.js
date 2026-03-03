// Paytm Order Status Checker & Payment Initiator - Cloudflare Worker
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        
        // Handle CORS
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Health check endpoint
        if (path === '/health') {
            return new Response(JSON.stringify({
                status: 'OK',
                message: 'Paytm Status Checker is running'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Payment initiation endpoint - /:amount
        const amountMatch = path.match(/^\/?(\d+(?:\.\d{1,2})?)$/);
        if (amountMatch) {
            return await handlePaymentInitiation(amountMatch[1], env, corsHeaders);
        }

        // Extract ORDERID from path (supports /:ORDERID and /check/:ORDERID)
        let orderId = null;
        const pathMatch = path.match(/^\/?([^\/]+)$/);
        const checkPathMatch = path.match(/^\/check\/([^\/]+)$/);
        
        if (pathMatch && isNaN(pathMatch[1])) {
            orderId = pathMatch[1];
        } else if (checkPathMatch) {
            orderId = checkPathMatch[1];
        }

        if (!orderId || orderId === 'health') {
            return new Response(JSON.stringify({
                success: false,
                message: 'Order ID is required. Use: /:ORDERID or /check/:ORDERID for status check, or /:amount for payment initiation'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        try {
            console.log(`Checking status for Order ID: ${orderId}`);

            // Get Merchant ID from environment variables
            const merchantId = env.PAYTM_MERCHANT_ID || 'YOUR_MERCHANT_ID_HERE';
            
            if (merchantId === 'YOUR_MERCHANT_ID_HERE') {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Merchant ID not configured. Please set PAYTM_MERCHANT_ID environment variable.'
                }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const statusResponse = await checkTxnStatus(orderId, merchantId);
            
            console.log('Paytm Response:', statusResponse);

            // Process the response
            const result = {
                success: false,
                orderId: orderId,
                status: statusResponse.STATUS || 'UNKNOWN',
                message: statusResponse.RESPMSG || 'No response message',
                amount: statusResponse.TXNAMOUNT || 0,
                transactionId: statusResponse.TXNID || null,
                bankTransactionId: statusResponse.BANKTXNID || null,
                paymentMode: statusResponse.PAYMENTMODE || null,
                transactionDate: statusResponse.TXNDATE || null,
                gatewayName: statusResponse.GATEWAYNAME || null,
                bankName: statusResponse.BANKNAME || null,
                rawResponse: statusResponse
            };

            // Mark as successful if status is TXN_SUCCESS
            if (statusResponse.STATUS === 'TXN_SUCCESS') {
                result.success = true;
            }

            return new Response(JSON.stringify(result), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } catch (error) {
            console.error('Error checking Paytm status:', error);
            return new Response(JSON.stringify({
                success: false,
                message: 'Failed to check payment status',
                error: error.message
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }
};

// Handle payment initiation
async function handlePaymentInitiation(amount, env, corsHeaders) {
    try {
        const merchantId = env.PAYTM_MERCHANT_ID || 'YOUR_MERCHANT_ID_HERE';
        
        if (merchantId === 'YOUR_MERCHANT_ID_HERE') {
            return new Response(JSON.stringify({
                success: false,
                message: 'Merchant ID not configured. Please set PAYTM_MERCHANT_ID environment variable.'
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Generate Order ID (similar to PHP logic)
        const orderId = generateOrderId();
        
        // Prepare payment parameters (same as PHP)
        const paramList = {
            MID: merchantId,
            ORDER_ID: orderId,
            CUST_ID: "CUST_" + Date.now(), // Generate customer ID
            EMAIL: "customer@example.com",
            INDUSTRY_TYPE_ID: "Retail",
            CHANNEL_ID: "WEB",
            TXN_AMOUNT: parseFloat(amount).toFixed(2),
            WEBSITE: "DEFAULT",
            CALLBACK_URL: `https://your-domain.com/payment/payTMCheckout` // Update with your callback URL
        };

        // Generate checksum (same as PHP - requires merchant key)
        // For now, we'll return the parameters without checksum for testing
        // In production, you'll need to implement checksum generation
        
        console.log(`Initiating payment for amount: ${amount}, Order ID: ${orderId}`);

        const result = {
            success: true,
            orderId: orderId,
            amount: paramList.TXN_AMOUNT,
            paymentUrl: "https://securegw.paytm.in/theia/processTransaction",
            parameters: paramList,
            message: "Payment initiated. Submit the form to Paytm gateway.",
            note: "Checksum generation needs to be implemented in production"
        };

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error initiating payment:', error);
        return new Response(JSON.stringify({
            success: false,
            message: 'Failed to initiate payment',
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// Generate Order ID (similar to PHP RAND_STRING + time + md5)
function generateOrderId() {
    const characters = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let randomString = '';
    for (let i = 0; i < 5; i++) {
        randomString += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const combined = randomString + Date.now().toString();
    return require('crypto').createHash('md5').update(combined).digest('hex');
}

// Generate checksum for Paytm
function generateChecksum(params, key) {
    const crypto = require('crypto');
    
    // Generate salt
    const salt = generateSalt(4);
    
    // Sort parameters
    const sortedKeys = Object.keys(params).sort();
    let paramString = '';
    
    for (let i = 0; i < sortedKeys.length; i++) {
        const key = sortedKeys[i];
        const value = params[key];
        
        if (value !== null && value !== undefined && value !== '' && 
            !value.includes('REFUND') && !value.includes('|')) {
            paramString += i === 0 ? value : '|' + value;
        }
    }
    
    const finalString = paramString + '|' + salt;
    const hash = crypto.createHash('sha256').update(finalString).digest('hex') + salt;
    
    // Encrypt the hash
    return encrypt(hash, key);
}

// Generate salt (similar to PHP)
function generateSalt(length) {
    const chars = 'AbcDE123IJKLMN67QRSTUVWXYZaBCdefghijklmn123opq45rs67tuv89wxyz0FGH45OP89';
    let salt = '';
    for (let i = 0; i < length; i++) {
        salt += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return salt;
}

// Encrypt function (similar to PHP)
function encrypt(text, key) {
    const crypto = require('crypto');
    const iv = '@@@@&&&&####$$$$';
    const cipher = crypto.createCipher('aes-128-cbc', key);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}

// Paytm transaction status check function
async function checkTxnStatus(orderId, merchantId) {
    const requestData = {
        MID: merchantId,
        ORDERID: orderId
    };

    const postData = 'JsonData=' + encodeURIComponent(JSON.stringify(requestData));

    const response = await fetch('https://securegw.paytm.in/merchant-status/getTxnStatus', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        },
        body: postData
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
}
