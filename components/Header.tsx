'use client';

import React from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Header = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const user = session?.user as {
    id: string;
    name: string;
    username: string;
  };

  return (
    <header className="w-full px-6 py-4 border-b bg-white flex justify-between items-center">
      <h1 className="text-xl font-semibold tracking-tight text-gray-800">
        MedCheckup
      </h1>

      {session?.user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="cursor-pointer">
              <AvatarFallback>
                {user.name[0]}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled>
             <strong className="ml-1">{user.name}</strong>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut()}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button variant="outline" onClick={() => router.push('/login')}>
          Doctor Login
        </Button>
      )}
    </header>
  );
};

export default Header;
