export async function createCheckout(params:{customerEmail?:string;priceId:string;successUrl:string;cancelUrl:string;metadata?:Record<string,string>}){
 const key=process.env.STRIPE_SECRET_KEY; if(!key) throw new Error('Stripe is not configured');
 const body=new URLSearchParams(); body.set('mode','payment'); body.set('line_items[0][price]',params.priceId); body.set('line_items[0][quantity]','1'); body.set('success_url',params.successUrl); body.set('cancel_url',params.cancelUrl); if(params.customerEmail)body.set('customer_email',params.customerEmail); Object.entries(params.metadata||{}).forEach(([k,v])=>body.set(`metadata[${k}]`,v));
 const r=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/x-www-form-urlencoded'},body}); if(!r.ok)throw new Error(`Stripe ${r.status}: ${await r.text()}`); return r.json();
}
