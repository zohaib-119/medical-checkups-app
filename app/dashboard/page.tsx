import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye } from "lucide-react";

interface Consultation {
  id: string;
  doctor_id: string;
  patient_name: string | null;
  patient_age: string | null;
  patient_gender: string | null;
  
}

const mockConsultations: Consultation[] = [
  {
    id: "1",
    doctor_id: "doc1",
    patient_name: "John Doe",
    patient_age: "35",
    patient_gender: "Male",
  },
  {
    id: "2",
    doctor_id: "doc1",
    patient_name: "Jane Smith",
    patient_age: "28",
    patient_gender: "Female",
  },
];

const Dashboard = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Consultations</h1>
        <Button>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockConsultations.map((checkup) => (
                <TableRow key={checkup.id}>
                  <TableCell>{checkup.patient_name}</TableCell>
                  <TableCell>{checkup.patient_age}</TableCell>
                  <TableCell>{checkup.patient_gender}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;