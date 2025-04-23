import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-md px-4 md:px-6">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tighter">
                Welcome Back
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Enter your credentials to access your account
              </p>
            </div>
            <LoginForm />
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
