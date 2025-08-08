"use client";

import React, { useEffect } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Eye, Keyboard, Stethoscope, Calendar, FileText, Activity, ClipboardList, FileX, User, AlertCircle, RefreshCcw } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Loading from "@/components/Loading";
import { useHotkeys } from 'react-hotkeys-hook';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Header from "@/components/Header";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Consultation {
  id: string;
  doctor_id: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  temperature?: number;
  blood_pressure?: string;
  blood_sugar?: string;
  symptoms: string;
  diagnosis: string;
  medications?: string;
  lab_tests?: string;
  notes?: string;
  created_at: string;
}

const Dashboard = () => {
  const [checkups, setCheckups] = useState<Consultation[] | null>(null);
  const [reload, setReload] = useState(0)
  const [autoPrint, setAutoPrint] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auto-print-checkups-app") === "true";
    }
    return false;
  });


  const { status } = useSession();

  const router = useRouter();

  useHotkeys('space', () => {
    router.push("/checkup/create")
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    localStorage.setItem("auto-print-checkups-app", autoPrint.toString())
  }, [autoPrint])

  useEffect(() => {
    const fetchCheckups = async () => {
      setCheckups(null)
      try {
        const response = await axios.get("/api/checkup");
        setCheckups(response.data);
      } catch (error) {
        console.log("Failed to fetch checkups:", error);
      }
    };
    fetchCheckups();
  }, [reload]);

  if (status === "loading") {
    return <Loading />;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="h-full">
      <Header />
      <div className="p-8 space-y-8 bg-gray-50/50 select-none">


        {/* Consultations Table */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="border-b px-4 flex justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <ClipboardList className="w-5 h-5 text-gray-600" />
              </div>
              <CardTitle className="text-xl font-medium text-gray-800">Recent Checkups</CardTitle>
              <RefreshCcw onClick={() => (setReload(prev => prev + 1))} className="cursor-pointer w-4 h-4 text-gray-800" />
            </div>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-print-switch"
                  className="data-[state=checked]:bg-blue-600"
                  onCheckedChange={() => setAutoPrint(prev => !prev)}
                  checked={autoPrint}
                />
                <Label htmlFor="auto-print-switch">
                  Auto-Print New Checkup
                </Label>
              </div>
              <Button
                onClick={() => router.push("/checkup/create")}
                className="h-10 px-6 text-base font-semibold bg-blue-600 hover:bg-blue-700 shadow-md"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Checkup
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-2">
            {checkups === null ? (
              // Loading skeleton
              <ScrollArea className="h-[45vh]">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow className="hover:bg-gray-50">
                      <TableHead className="w-16 font-semibold text-gray-700">#</TableHead>
                      <TableHead className="font-semibold text-gray-700 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Date
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 min-w-[150px]">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Patient Name
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Symptoms
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4" />
                          Diagnosis
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 min-w-[180px]">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Notes
                        </div>
                      </TableHead>
                      <TableHead className="text-center font-semibold text-gray-700 w-32">
                        {/* Actions */}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[1, 2, 3, 4].map((i) => (
                      <TableRow key={i} className="border-b">
                        <TableCell className="py-4">
                          <Skeleton className="h-5 w-6" />
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <Skeleton className="w-8 h-8 rounded-full" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell className="py-4">
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell className="py-4">
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <Skeleton className="h-8 w-16 mx-auto" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ScrollBar orientation="vertical" />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            ) : checkups && checkups.length === 0 ? (
              // No checkups found state
              <div className="text-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-gray-100 rounded-full">
                    <FileX className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-600 mb-2">No checkups found</p>
                    <p className="text-sm text-gray-500">Create your first patient checkup to get started</p>
                  </div>
                  <Button
                    onClick={() => router.push("/checkup/create-checkup")}
                    className="mt-4 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Checkup
                  </Button>
                </div>
              </div>
            ) : (
              // Data loaded state
              <ScrollArea className=" h-[45vh]">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow className="hover:bg-gray-50">
                      <TableHead className="w-16 font-semibold text-gray-700">#</TableHead>
                      <TableHead className="font-semibold text-gray-700 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Date
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 min-w-[150px]">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Patient Name
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Symptoms
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4" />
                          Diagnosis
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 min-w-[180px]">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Notes
                        </div>
                      </TableHead>
                      <TableHead className="text-center font-semibold text-gray-700 w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checkups && checkups.map((checkup, index) => (
                      <TableRow key={checkup.id} className="hover:bg-blue-50/50 transition-colors border-b">
                        <TableCell className="font-semibold text-gray-600 py-4">{index + 1}</TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800">
                              {new Date(checkup.created_at).toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(checkup.created_at).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            {/* <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div> */}
                            <span className="font-medium text-gray-800">{checkup.patient_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs py-4" title={checkup.symptoms}>
                          <p className="truncate text-gray-700 leading-relaxed">
                            {checkup.symptoms}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-xs py-4" title={checkup.diagnosis}>
                          <p className="truncate text-gray-700 leading-relaxed">
                            {checkup.diagnosis}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-xs py-4" title={checkup.notes || ""}>
                          <p className="truncate text-gray-600 leading-relaxed">
                            {checkup.notes || <span className="text-gray-400 italic">No notes</span>}
                          </p>
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/checkup/${checkup.id}`)}
                            className="font-medium hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ScrollBar orientation="vertical" />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
            <div className="px-8 py-4 bg-gray-50/50 border-t">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Keyboard className="w-4 h-4" />
                <span className="animate-pulse font-medium">Press 'Spacebar' to Create Checkup</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
