'use client';

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { signIn } from 'next-auth/react';
import { useSession } from "next-auth/react";
import Loading from "@/components/Loading";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("");

  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {

    e.preventDefault();
    setLoading(true);

    const result = await signIn('credentials', {
      redirect: false,
      username: form.username,
      password: form.password,
    });

    if (result?.ok) {
      router.replace('/dashboard');
    } else {
      setError('Invalid Credentials, Try Again!')
      setForm({ username: '', password: '' })
    }
    setLoading(false)
  };

  if (status === 'loading') {
    return <Loading />;
  }

  if (status === 'authenticated') {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
    <Card className="w-full max-w-md shadow-xl border border-gray-200 rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-center text-3xl font-bold text-gray-800">
          Doctor Login
        </CardTitle>
      </CardHeader>
  
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-6">
          
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="dr.john"
              value={form.username}
              onChange={handleChange}
              required
              className="focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
  
          {/* Password */}
          <div className="space-y-2 relative">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              className="pr-12 focus:ring-2 focus:ring-blue-500 transition"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-7 p-1 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
  
          {/* Error */}
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{error}</p>}
  
          {/* Submit */}
          <Button type="submit" className="w-full bg-teal-800" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
  


  );
}
