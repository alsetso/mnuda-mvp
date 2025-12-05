import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import SimplePageLayout from '@/components/SimplePageLayout';
import { getServerAuth } from '@/lib/authServer';

export default async function Home() {
  // Server-side auth check - redirect if logged in
  const auth = await getServerAuth();
  if (auth) {
    redirect('/feed');
  }

  return (
    <SimplePageLayout contentPadding="px-0" footerVariant="light">
      <div>
        {/* Hero Section */}
        <section className="bg-[#f4f2ef] py-3 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
          <div className="w-full px-[10px]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-center max-w-7xl mx-auto">
              {/* Left Side - Sign-in Content */}
              <div className="space-y-3">
                {/* Minnesota Badge */}
                <div>
                  <span className="inline-block px-[10px] py-[10px] bg-gray-700 text-white text-xs font-medium rounded-md tracking-wide uppercase">
                    Minnesota Only
                  </span>
                </div>
                
                {/* Headline */}
                <h1 className="text-sm font-semibold text-gray-900 leading-tight tracking-tight">
                  Discover new opportunities
                </h1>
                
                {/* CTA Buttons */}
                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="block w-full px-[10px] py-[10px] bg-transparent border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-900 font-medium rounded-md transition-colors text-center"
                  >
                    Sign in with email
                  </Link>
                </div>

                {/* Legal Text */}
                <p className="text-xs text-gray-500 leading-relaxed">
                  By continuing, you agree to MNUDA's{' '}
                  <Link href="/legal/user-agreement" className="text-gray-600 hover:text-gray-900 underline">User Agreement</Link>,{' '}
                  <Link href="/legal/privacy-policy" className="text-gray-600 hover:text-gray-900 underline">Privacy Policy</Link>, and{' '}
                  <Link href="/legal/community-guidelines" className="text-gray-600 hover:text-gray-900 underline">Community Guidelines</Link>.
                </p>

                {/* Join Prompt */}
                <p className="text-xs text-gray-600">
                  New to MNUDA?{' '}
                  <Link href="/login" className="text-gray-900 font-medium hover:underline">
                    Join now
                  </Link>
                </p>
              </div>

              {/* Right Side - Illustration */}
              <div className="hidden lg:block">
                <div className="w-full h-[480px] relative rounded-md overflow-hidden bg-white/50">
                  <Image
                    src="/guy-on-computer.png"
                    alt="Person working at computer"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </SimplePageLayout>
  );
}

