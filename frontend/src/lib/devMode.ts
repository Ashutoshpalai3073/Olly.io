export const IS_DEV_MODE =
  import.meta.env.DEV === true && !import.meta.env.VITE_SUPABASE_URL

if (IS_DEV_MODE) {
  console.info(
    '%c[Olly] Dev mode active%c — using mock data. Set VITE_SUPABASE_URL in .env.local to connect to Supabase.',
    'color:#FF6B35;font-weight:bold',
    'color:inherit',
  )
}
