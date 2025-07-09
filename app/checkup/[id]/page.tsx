'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'


interface Checkup {
  id: string,
  doctor_name: string,
  patient_name: string | null,
  patient_age: number | null,
  patient_gender: 'male' | 'female' | 'other' | null,
  patient_medical_history: string | null,
  symptoms: string
  diagnosis: string
  prescription: string
  notes: string | null
  
  created_at: string
}

const mockCheckup: Checkup = {
  id: 'chk-123456',
  doctor_name: 'Dr. Sarah Khan',
  patient_name: 'Ali Raza',
  patient_age: 45,
  patient_gender: 'male',
  patient_medical_history: 'Diabetes, Hypertension',
  symptoms: 'Fever, Cough, Fatigue',
  diagnosis: 'Viral Flu',
  prescription: 'Paracetamol 500mg, 3 times a day for 5 days',
  notes: 'Advised rest and hydration',
  created_at: '2025-07-09T12:34:56.000Z',
}

const Checkup = () => {
  const router = useRouter()

  const handlePrint = () => {
    window.print()
  }

  return (
    <main className="p-6 max-w-3xl mx-auto print:bg-white print:text-black">
      <div className="flex justify-between mb-4 print:hidden">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
        <Button onClick={handlePrint}>Print</Button>
      </div>

      <Card className="shadow-xl border border-gray-200">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Patient Checkup Summary
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-black">Date:</span> {new Date(mockCheckup.created_at).toLocaleString()}
          </div>
          <Separator />

          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-black">Doctor</h3>
            <p>{mockCheckup.doctor_name}</p>
          </div>

          <Separator />

          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-black">Patient Information</h3>
            <p>
              <strong>Name:</strong> {mockCheckup.patient_name}<br />
              <strong>Age:</strong> {mockCheckup.patient_age}<br />
              <strong>Gender:</strong>{' '}
              <Badge variant="secondary">{mockCheckup.patient_gender}</Badge>
            </p>
          </div>

          <Separator />

          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-black">Medical History</h3>
            <p>{mockCheckup.patient_medical_history}</p>
          </div>

          <Separator />

          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-black">Symptoms</h3>
            <p>{mockCheckup.symptoms}</p>
          </div>

          <Separator />

          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-black">Diagnosis</h3>
            <p>{mockCheckup.diagnosis}</p>
          </div>

          <Separator />

          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-black">Prescription</h3>
            <p>{mockCheckup.prescription}</p>
          </div>

          <Separator />

          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-black">Notes</h3>
            <p>{mockCheckup.notes}</p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

export default Checkup
