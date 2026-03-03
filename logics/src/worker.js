export default {
  async fetch(request) {

    const url = new URL(request.url);
    const orderId = url.pathname.slice(1);

    if (!orderId) {
      return Response.json({ error: "Order ID missing" }, { status: 400 });
    }

    // ⚠️ HARDCODED (NOT SAFE FOR PRODUCTION)
    const PAYTM_MID = "ZIrAGA72236364605077";
    const PAYTM_MERCHANT_KEY = "ZIrAGA72236364605077";

    const body = {
      mid: PAYTM_MID,
      orderId: orderId
    };

    const signature = await generateSignature(body, PAYTM_MERCHANT_KEY);

    const paytmRes = await fetch(
      "https://securegw.paytm.in/v3/order/status",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          body,
          head: { signature }
        })
      }
    );

    const result = await paytmRes.json();

    if (result?.body?.resultInfo?.resultStatus === "TXN_SUCCESS") {
      return Response.json({ status: "success" });
    }

    return Response.json({ status: "fail" });
  }
};

async function generateSignature(body, merchantKey) {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(merchantKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(JSON.stringify(body))
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}