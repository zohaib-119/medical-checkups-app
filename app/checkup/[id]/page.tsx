'use client'

import React, { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import Loading from '@/components/Loading'

interface Checkup {
  id: string,
  doctor_name: string,
  patient_name: string | null,
  patient_age: number | null,
  patient_gender: 'male' | 'female' | 'other' | null,
  temperature?: string | null,
  blood_pressure?: string | null,
  blood_sugar?: string | null,
  symptoms: string
  diagnosis: string
  medications: string | null,
  lab_tests: string | null,
  notes: string | null
  created_at: string
}

const Checkup = () => {
  const [checkup, setCheckup] = React.useState<Checkup | null>(null)
  const { id } = useParams<{ id: string }>()

  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    const fetchCheckup = async () => {
      try {
        const response = await axios.get(`/api/checkup/${id}`)
        setCheckup(response.data)
        console.log('Fetched checkup:', response.data)
      } catch (error) {
        console.error('Failed to fetch checkup:', error)
        router.push('/dashboard')
      }
    }
    fetchCheckup()
  }, [id])

  const handlePrint = () => {
    window.print()
  }

  if (!checkup) {
    return <Loading />;
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
            <span className="font-medium text-black">Date:</span> {new Date(checkup.created_at).toLocaleString()}
          </div>
          <Separator />

          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-black">Doctor</h3>
            <p>{checkup.doctor_name}</p>
          </div>

          <Separator />

          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-black">Patient Information</h3>
            <p>
              <strong>Name:</strong> {checkup.patient_name}<br />
              <strong>Age:</strong> {checkup.patient_age}<br />
              <strong>Gender:</strong>{' '}
              <Badge variant="secondary">{checkup.patient_gender}</Badge>
            </p>
          </div>

          <Separator />

          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-black">Medical History</h3>
            <p>
              {checkup.temperature && <><strong>Temperature:</strong> {checkup.temperature}°C<br /></>}
              {checkup.blood_pressure && <><strong>Blood Pressure:</strong> {checkup.blood_pressure}<br /></>}
              {checkup.blood_sugar && <><strong>Blood Sugar:</strong> {checkup.blood_sugar} mg/dL</>}
            </p>
          </div>

          <Separator />

          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-black">Symptoms</h3>
            <p>{checkup.symptoms}</p>
          </div>

          <Separator />

          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-black">Diagnosis</h3>
            <p>{checkup.diagnosis}</p>
          </div>

          <Separator />

          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-black">Prescription</h3>
            <p>
              {checkup.medications && <><strong>Medications:</strong> {checkup.medications}<br /></>}
              {checkup.lab_tests && <><strong>Lab Tests:</strong> {checkup.lab_tests}</>}
            </p>
          </div>

          <Separator />

          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-black">Notes</h3>
            <p>{checkup.notes}</p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

export default Checkup