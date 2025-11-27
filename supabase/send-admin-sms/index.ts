const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { record } = await req.json();

    // Twilio credentials from secrets
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')!;

    // Admin phone numbers
    const adminPhones = [
      '+16026141243', // jdavault
      '+16232209724', // support
    ];

    // Create message
    const message = `🎉 New Restaurant Registration!\n\n${record.name}\n${record.city}, ${record.state}\n\nReview: https://allergyawaremenu.com/admin`;

    // Send to each admin
    const results = [];
    for (const phone of adminPhones) {
      const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: phone,
            From: twilioPhoneNumber,
            Body: message,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Twilio error: ${await response.text()}`);
      }

      results.push(await response.json());
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
