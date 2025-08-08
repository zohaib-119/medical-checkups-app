'use client'

import React, { useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import { useSession } from 'next-auth/react'
import Loading from '@/components/Loading'
import {
  ArrowLeft, Printer, Calendar, UserCheck, User, Activity,
  Thermometer, Heart, Droplet, AlertCircle, Stethoscope, Pill,
  TestTube, FileText, Scale,
  ShieldPlus
} from 'lucide-react'
import { useHotkeys } from "react-hotkeys-hook";
import { Prescription } from '@/components/Prescription'
import { useReactToPrint } from 'react-to-print'

export interface Checkup {
  id?: string,
  doctor_name?: string,
  patient_name?: string,
  patient_age?: string,
  patient_gender?: 'male' | 'female' | 'other',
  temperature?: string,
  blood_pressure?: string,
  blood_sugar?: string,
  body_weight?: string,
  symptoms?: string
  diagnosis?: string
  medications?: string,
  lab_tests?: string,
  notes?: string
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
      } catch {
        router.push('/dashboard')
      }
    }
    fetchCheckup()
  }, [id])

  useHotkeys(
    "esc",
    () => {
      router.push("/dashboard");
    }
  );
  useHotkeys(
    "ctrl+p",
    (e) => {
      handlePrint()
      e.preventDefault()
    }
  );

  // const handlePrint = () => window.print()
  const printableRef = useRef<HTMLDivElement | null>(null);
  const handlePrint = useReactToPrint({ contentRef: printableRef });

  if (!checkup) return <Loading />

  return (
    <main className="min-h-screen bg-white print:bg-white text-sm ">
      {/* Header - Hidden on print */}
      <div className="sticky top-0 bg-white border-b border-gray-200 print:hidden z-10">
        <div className="max-w-5xl mx-auto px-4 py-2 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold">Checkup Details</h1>
            <Button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800"
            >
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>
      </div>

      <Prescription checkup={checkup} ref={printableRef} />
    </main>
    // <main className="min-h-screen bg-white print:bg-white text-sm ">
    //   {/* Header - Hidden on print */}
    //   <div className="sticky top-0 bg-white border-b border-gray-200 print:hidden z-10">
    //     <div className="max-w-5xl mx-auto px-4 py-2 flex justify-between items-center">
    //       <Button
    //         variant="outline"
    //         onClick={() => router.push('/dashboard')}
    //         className="flex items-center gap-2"
    //       >
    //         <ArrowLeft className="w-4 h-4" /> Back
    //       </Button>
    //       <div className="flex items-center gap-2">
    //         <h1 className="font-semibold">Checkup Details</h1>
    //         <Button
    //           onClick={handlePrint}
    //           className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800"
    //         >
    //           <Printer className="w-4 h-4" /> Print
    //         </Button>
    //       </div>
    //     </div>
    //   </div>

    //   {/* Main Content */}
    //   <div className="max-w-5xl mx-auto p-4 print:p-4 print:max-w-none">
    //     {/* Document Header */}
    //     <div className="text-center mb-4">
    //       <div className="flex justify-center items-center gap-2">
    //         <Stethoscope className="w-6 h-6 text-gray-700" />
    //         <h1 className="text-lg font-bold">Medical Checkup Report</h1>
    //       </div>
    //       <div className="flex justify-center items-center gap-1 text-gray-600 text-xs mt-1">
    //         <Calendar className="w-3 h-3" />
    //         <span>
    //           {new Date(checkup.created_at).toLocaleDateString('en-US', {
    //             year: 'numeric', month: 'short', day: 'numeric'
    //           })} {new Date(checkup.created_at).toLocaleTimeString('en-US', {
    //             hour: '2-digit', minute: '2-digit'
    //           })}
    //         </span>
    //       </div>
    //     </div>

    //     <Card className="border border-gray-400 shadow-none">
    //       <CardContent className="p-4 space-y-8">
    //         {/* Doctor + Patient Info in grid */}
    //         <div>
    //           <h2 className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase border-b border-gray-300 pb-0.5">
    //             <UserCheck className="w-3 h-3" /> Attending Physician
    //           </h2>
    //           <p className="mt-1">{checkup.doctor_name}</p>
    //         </div>
    //         <div className="grid grid-cols-2 gap-4">
    //           <div>
    //             <h2 className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase border-b border-gray-300 pb-0.5">
    //               <User className="w-3 h-3" /> Patient Info
    //             </h2>
    //             <div className="grid grid-cols-4 gap-2 mt-1">
    //               <div className='col-span-2'>
    //                 <p className="text-[10px] text-gray-500 uppercase">Name</p>
    //                 <p>{checkup.patient_name}</p>
    //               </div>
    //               <div>
    //                 <p className="text-[10px] text-gray-500 uppercase">Age</p>
    //                 <p >{checkup.patient_age}</p>
    //               </div>
    //               <div>
    //                 <p className="text-[10px] text-gray-500 uppercase">Gender</p>
    //                 <p className='capitalize'>{checkup.patient_gender}</p>
    //                 {/* <Badge variant="outline" className="px-1 text-xs">
    //                   {checkup.patient_gender}
    //                 </Badge> */}
    //               </div>
    //             </div>
    //           </div>

    //           {/* Vital Signs */}
    //           <div>
    //             <h2 className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase border-b border-gray-300 pb-0.5">
    //               <Activity className="w-3 h-3" /> Vitals
    //             </h2>
    //             <div className="grid grid-cols-4 gap-2 mt-1">
    //               {checkup.temperature && (
    //                 <div>
    //                   <p className="text-[10px] text-gray-500 uppercase">Temperatue</p>
    //                   <p>{checkup.temperature}</p>
    //                 </div>
    //               )}
    //               {checkup.blood_pressure && (
    //                 <div>
    //                   <p className="text-[10px] text-gray-500 uppercase">Blood Pressure</p>
    //                   <p>{checkup.blood_pressure}</p>
    //                 </div>
    //               )}
    //               {checkup.blood_sugar && (
    //                 <div>
    //                   <p className="text-[10px] text-gray-500 uppercase">Blood Sugar</p>
    //                   <p>{checkup.blood_sugar}</p>
    //                 </div>
    //               )}
    //               {checkup.body_weight && (
    //                 <div>
    //                   <p className="text-[10px] text-gray-500 uppercase">Body Weight</p>
    //                   <p>{checkup.body_weight}</p>
    //                 </div>
    //               )}
    //             </div>
    //           </div>
    //         </div>



    //         {/* Symptoms + Diagnosis in two columns
    //         <div className="grid grid-cols-2 gap-4">
    //           <div>
    //             <h2 className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase border-b border-gray-300 pb-0.5">
    //               <AlertCircle className="w-3 h-3" /> Symptoms
    //             </h2>
    //             <p className="mt-1">{checkup.symptoms}</p>
    //           </div>
    //           <div>
    //             <h2 className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase border-b border-gray-300 pb-0.5">
    //               <Stethoscope className="w-3 h-3" /> Diagnosis
    //             </h2>
    //             <p className="mt-1 font-medium">{checkup.diagnosis}</p>
    //           </div>
    //         </div> */}

    //         {/* Symptoms + Diagnosis in two columns */}
    //         <div>
    //           <h2 className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase border-b border-gray-300 pb-0.5">
    //             <Stethoscope className="h-3 w-3" /> Clinical Assessment
    //           </h2>
    //           <div className="grid grid-cols-2 gap-2 mt-1">
    //             {checkup.symptoms && (
    //               <div>
    //                 <p className="text-[10px] text-gray-500 uppercase ">Symptoms </p>
    //                 <p >{checkup.symptoms}</p>
    //               </div>
    //             )}
    //             {checkup.diagnosis && (
    //               <div>
    //                 <p className="text-[10px] text-gray-500 uppercase ">Diagnosis</p>
    //                 <p >{checkup.diagnosis}</p>
    //               </div>
    //             )}
    //           </div>
    //         </div>

    //         {/* Medications + Lab Tests */}
    //         {/* {(checkup.medications || checkup.lab_tests) && (
    //           <div className="grid grid-cols-2 gap-4">
    //             {checkup.medications && (
    //               <div>
    //                 <h2 className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase border-b border-gray-300 pb-0.5">
    //                   <Pill className="w-3 h-3" /> Medications
    //                 </h2>
    //                 <p className="mt-1">{checkup.medications}</p>
    //               </div>
    //             )}
    //             {checkup.lab_tests && (
    //               <div>
    //                 <h2 className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase border-b border-gray-300 pb-0.5">
    //                   <TestTube className="w-3 h-3" /> Lab Tests
    //                 </h2>
    //                 <p className="mt-1">{checkup.lab_tests}</p>
    //               </div>
    //             )}
    //           </div>
    //         )} */}

    //         {(checkup.medications || checkup.lab_tests) && (
    //           <div>
    //             <h2 className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase border-b border-gray-300 pb-0.5">
    //               <Pill className="h-3 w-3" /> Treatment Plan
    //             </h2>
    //             <div className="grid grid-cols-2 gap-2 mt-1">
    //               {checkup.medications && (
    //                 <div>
    //                   <p className="text-[10px] text-gray-500 uppercase">Medications </p>
    //                   <p > {checkup.medications}</p>
    //                 </div>
    //               )}
    //               {checkup.lab_tests && (
    //                 <div>
    //                   <p className="text-[10px] text-gray-500 uppercase ">Lab Tests</p>
    //                   <p >{checkup.medications}</p>
    //                 </div>
    //               )}
    //             </div>
    //           </div>
    //           // <div className="grid grid-cols-2 gap-4">
    //           //   {checkup.medications && (
    //           //     <div>
    //           //       <h2 className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase border-b border-gray-300 pb-0.5">
    //           //         <Pill className="w-3 h-3" /> Medications
    //           //       </h2>
    //           //       <p className="mt-1">{checkup.medications}</p>
    //           //     </div>
    //           //   )}
    //           //   {checkup.lab_tests && (
    //           //     <div>
    //           //       <h2 className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase border-b border-gray-300 pb-0.5">
    //           //         <TestTube className="w-3 h-3" /> Lab Tests
    //           //       </h2>
    //           //       <p className="mt-1">{checkup.lab_tests}</p>
    //           //     </div>
    //           //   )}
    //           // </div>
    //         )}

    //         {/* Notes */}
    //         {checkup.notes && (
    //           <div>
    //             <h2 className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase border-b border-gray-300 pb-0.5">
    //               <FileText className="w-3 h-3" /> Notes
    //             </h2>
    //             <p className="mt-1">{checkup.notes}</p>
    //           </div>
    //         )}

    //         {/* Footer */}
    //         <div className="pt-12 border-t border-gray-400 text-xs flex justify-between items-end">
    //           <div>
    //             <p>ID: {checkup.id.slice(-8).toUpperCase()}</p>
    //             <p className="text-gray-500">
    //               Generated {new Date().toLocaleDateString('en-US', {
    //                 year: 'numeric', month: 'short', day: 'numeric'
    //               })}
    //             </p>
    //           </div>
    //           <div className="text-right">
    //             <div className="border-t border-gray-400 w-32 mb-1"></div>
    //             <p>Doctor's Signature</p>
    //           </div>
    //         </div>
    //       </CardContent>
    //     </Card>
    //   </div>
    //   {/* 
    //   <style jsx global>{`
    //     @media print {
    //       body {
    //         font-size: 11px;
    //         line-height: 1.25;
    //       }
    //       .print\\:p-4 {
    //         padding: 0 !important;
    //       }
    //     }
    //   `}</style> */}
    // </main>
  )
}

export default Checkup
