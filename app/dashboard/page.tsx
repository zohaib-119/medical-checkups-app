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
import { Plus, Eye } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Loading from "@/components/Loading";

interface Consultation {
  id: string;
  doctor_id: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  patient_medical_history: string;
  symptoms: string;
  diagnosis: string;
  prescription?: string;
  notes?: string;
  created_at: string;
}

const Dashboard = () => {
  const [checkups, setCheckups] = useState<Consultation[]>([]);

  const { status } = useSession();

  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchCheckups = async () => {
      try {
        const response = await axios.get("/api/checkup");
        setCheckups(response.data);
      } catch (error) {
        console.log("Failed to fetch checkups:", error);
      }
    };
    fetchCheckups();
  }, []);

  if (status === "loading") {
    return <Loading />;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Checkups</h1>
        <Button onClick={() => router.push("/checkup/create")}>
          <Plus className="w-4 h-4 mr-2" />
          Create Checkup
        </Button>
      </div>

      {/* Consultations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Checkups</CardTitle>
        </CardHeader>
        <CardContent>
            {checkups.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No checkups found.
            </div>
            ) : (
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Medical History</TableHead>
                <TableHead>Symptoms</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead>Prescriptions</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkups.map((checkup, index) => (
                <TableRow key={checkup.id} className="hover:bg-muted/50 transition">
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                  {new Date(checkup.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                  </TableCell>
                  <TableCell>{checkup.patient_name}</TableCell>
                  <TableCell>{checkup.patient_age}</TableCell>
                  <TableCell>{checkup.patient_gender}</TableCell>
                  <TableCell className="max-w-xs truncate" title={checkup.patient_medical_history}>
                  {checkup.patient_medical_history}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={checkup.symptoms}>
                  {checkup.symptoms}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={checkup.diagnosis}>
                  {checkup.diagnosis}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={checkup.prescription || ""}>
                  {checkup.prescription || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={checkup.notes || ""}>
                  {checkup.notes || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/checkup/${checkup.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  </TableCell>
                </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
