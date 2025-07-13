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

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
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
        setForm({  username: '', password: '' })
      }
      setLoading(false)
    };

    if(status === 'loading') { 
      return <Loading/>;
    }

    if(status === 'authenticated') {
      return null;
    }

  return (
    <main className="h-full flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg border rounded-xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">
            Doctor Login
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username" className="mb-2">Email</Label>
              <Input
                id="username"
                name="username"
                type="username"
                placeholder="username"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="mb-2">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
