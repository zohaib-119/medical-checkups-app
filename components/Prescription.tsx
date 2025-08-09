'use client'

import { Checkup } from '@/app/checkup/[id]/page'
import React from 'react'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'
import { Activity, ArrowLeft, Calendar, FileText, Pill, Printer, Stethoscope, User, UserCheck } from 'lucide-react'
import { Card, CardContent } from './ui/card'

export const Prescription = React.forwardRef<HTMLDivElement, { checkup: Checkup }>(({ checkup }, ref) => {
    const displayDate = new Date(checkup.created_at);
    return (
        <div ref={ref}>
            {/* Main Content */}
            <div className="max-w-5xl mx-auto p-4 print:p-4 print:max-w-none">
                {/* Document Header */}
                <div className="text-center mb-4">
                    <div className="flex justify-center items-center gap-2">
                        <Stethoscope className="w-6 h-6 text-gray-700" />
                        <h1 className="text-lg font-bold">Medical Checkup Report</h1>
                    </div>
                    <div className="flex justify-center items-center gap-1 text-gray-600 text-xs mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                            {displayDate.toLocaleDateString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric'
                            })} {displayDate.toLocaleTimeString('en-US', {
                                hour: '2-digit', minute: '2-digit'
                            })}
                        </span>
                    </div>
                </div>

                <Card className="border border-gray-400 shadow-none">
                    <CardContent className="p-4 space-y-8">
                        {/* Doctor + Patient Info in grid */}
                        <div>
                            <h2 className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase border-b border-gray-300 pb-0.5">
                                <UserCheck className="w-3 h-3" /> Attending Physician
                            </h2>
                            <p className="mt-1">{checkup.doctor_name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h2 className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase border-b border-gray-300 pb-0.5">
                                    <User className="w-3 h-3" /> Patient Info
                                </h2>
                                <div className="grid grid-cols-4 gap-2 mt-1">
                                    <div className='col-span-2'>
                                        <p className="text-[10px] text-gray-500 uppercase">Name</p>
                                        <p>{checkup.patient_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase">Age</p>
                                        <p >{checkup.patient_age}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase">Gender</p>
                                        <p className='capitalize'>{checkup.patient_gender}</p>
                                        {/* <Badge variant="outline" className="px-1 text-xs">
                      {checkup.patient_gender}
                    </Badge> */}
                                    </div>
                                </div>
                            </div>

                            {/* Vital Signs */}
                            <div>
                                <h2 className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase border-b border-gray-300 pb-0.5">
                                    <Activity className="w-3 h-3" /> Vitals
                                </h2>
                                <div className="grid grid-cols-4 gap-2 mt-1">
                                    {checkup.temperature && (
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase">Temperatue</p>
                                            <p>{checkup.temperature}</p>
                                        </div>
                                    )}
                                    {checkup.blood_pressure && (
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase">Blood Pressure</p>
                                            <p>{checkup.blood_pressure}</p>
                                        </div>
                                    )}
                                    {checkup.blood_sugar && (
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase">Blood Sugar</p>
                                            <p>{checkup.blood_sugar}</p>
                                        </div>
                                    )}
                                    {checkup.body_weight && (
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase">Body Weight</p>
                                            <p>{checkup.body_weight}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>


                        {/* Symptoms + Diagnosis in two columns */}
                        <div>
                            <h2 className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase border-b border-gray-300 pb-0.5">
                                <Stethoscope className="h-3 w-3" /> Clinical Assessment
                            </h2>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                {checkup.symptoms && (
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase ">Symptoms </p>
                                        <p >{checkup.symptoms.split('\n').map((line, index, array) => (
                                            <React.Fragment key={index}>
                                                {line}
                                                {index < array.length - 1 && <br />}
                                            </React.Fragment>
                                        ))}</p>
                                    </div>
                                )}
                                {checkup.diagnosis && (
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase ">Diagnosis</p>
                                        <p >{checkup.diagnosis.split('\n').map((line, index, array) => (
                                            <React.Fragment key={index}>
                                                {line}
                                                {index < array.length - 1 && <br />}
                                            </React.Fragment>
                                        ))}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Medications + Lab Tests */}
                        {(checkup.medications || checkup.lab_tests) && (
                            <div>
                                <h2 className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase border-b border-gray-300 pb-0.5">
                                    <Pill className="h-3 w-3" /> Treatment Plan
                                </h2>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    {checkup.medications && (
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase">Medications </p>
                                            <p > {checkup.medications.split('\n').map((line, index, array) => (
                                                <React.Fragment key={index}>
                                                    {line}
                                                    {index < array.length - 1 && <br />}
                                                </React.Fragment>
                                            ))}</p>
                                        </div>
                                    )}
                                    {checkup.lab_tests && (
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase ">Lab Tests</p>
                                            <p >{checkup.lab_tests.split('\n').map((line, index, array) => (
                                                <React.Fragment key={index}>
                                                    {line}
                                                    {index < array.length - 1 && <br />}
                                                </React.Fragment>
                                            ))}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                        )}

                        {/* Notes */}
                        {checkup.notes && (
                            <div>
                                <h2 className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase border-b border-gray-300 pb-0.5">
                                    <FileText className="w-3 h-3" /> Notes
                                </h2>
                                <p className="mt-1">{checkup.notes.split('\n').map((line, index, array) => (
                                    <React.Fragment key={index}>
                                        {line}
                                        {index < array.length - 1 && <br />}
                                    </React.Fragment>
                                ))}</p>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="pt-12 border-t border-gray-400 text-xs flex justify-between items-end">
                            <div>
                                <p>ID: {checkup.id?.slice(-8).toUpperCase() || "NIL"}</p>
                                <p className="text-gray-500">
                                    Generated {new Date().toLocaleDateString('en-US', {
                                        year: 'numeric', month: 'short', day: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="border-t border-gray-400 w-32 mb-1"></div>
                                <p>Doctor's Signature</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
})