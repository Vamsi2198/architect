// Gives the browser the public values it needs: the two Supabase credentials
// (both safe to expose; row level security decides what each user can read)
// and the monthly credit cap so the UI can show a real meter.
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
  res.status(200).json({
    url: process.env.SUPABASE_URL || '',
    key: process.env.SUPABASE_ANON_KEY || '',
    creditCap: Math.max(1, parseInt(process.env.CREDIT_CAP_MONTHLY || '100', 10))
  });
};
