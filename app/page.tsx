'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Stethoscope, ShieldCheck, Mic, User } from "lucide-react";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero Section */}
      <section className="min-h-[60vh] flex flex-col justify-center items-center text-center px-4 py-12 bg-gray-50">
        <div className="max-w-2xl space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
            Medical Checkups Platform
          </h2>
          <p className="text-base md:text-lg text-gray-600">
            A modern platform for doctors to quickly record consultations, diagnoses, and prescriptions — all in one streamlined step.
          </p>
          <div className="pt-4">
            <Button size="lg" onClick={() => router.push("/login")}>
              Doctor Login
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 md:px-20 bg-white">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-12">
          Built for Busy Doctors
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6 flex flex-col items-center text-center shadow-md hover:shadow-lg transition">
            <Stethoscope className="text-gray-700 w-8 h-8 mb-3" />
            <h3 className="font-semibold text-lg mb-1">One-Step Consultation</h3>
            <p className="text-sm text-gray-600">Record symptoms, diagnosis, and notes in a single, easy-to-use form.</p>
          </Card>
          <Card className="p-6 flex flex-col items-center text-center shadow-md hover:shadow-lg transition">
            <Mic className="text-gray-700 w-8 h-8 mb-3" />
            <h3 className="font-semibold text-lg mb-1">Voice Recording</h3>
            <p className="text-sm text-gray-600">Attach voice notes or full audio consultations securely via Cloudinary.</p>
          </Card>
          <Card className="p-6 flex flex-col items-center text-center shadow-md hover:shadow-lg transition">
            <User className="text-gray-700 w-8 h-8 mb-3" />
            <h3 className="font-semibold text-lg mb-1">No Patient Overhead</h3>
            <p className="text-sm text-gray-600">Forget extra steps — just enter basic patient info when needed.</p>
          </Card>
          <Card className="p-6 flex flex-col items-center text-center shadow-md hover:shadow-lg transition">
            <ShieldCheck className="text-gray-700 w-8 h-8 mb-3" />
            <h3 className="font-semibold text-lg mb-1">Secure & Private</h3>
            <p className="text-sm text-gray-600">Only authorized doctors can access and submit data, ensuring confidentiality.</p>
          </Card>
        </div>
      </section>
    </div>
  );
}
