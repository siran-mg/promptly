import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

// Redirect to the dashboard if the user is logged in, otherwise to the home page
export default async function HomePage({ params }: { params: { locale: string } }) {
  // Check if the user is logged in
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    // If logged in, redirect to the localized dashboard
    redirect(`/${params.locale}/dashboard`);
  } else {
    // If not logged in, redirect to the home page
    redirect(`/${params.locale}/home`);
  }
}
