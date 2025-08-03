"use client";

import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FocusTrap } from "focus-trap-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  Pause,
  Play,
  Loader2,
  Thermometer,
  HeartPulse,
  Droplet,
} from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Loading from "@/components/Loading";
import { toast } from "sonner";
import { useHotkeys } from "react-hotkeys-hook";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useUpload } from "@/components/providers/UploadContext";
import printJS from "print-js";

interface CheckupFormData {
  patient_name: string;
  patient_age?: number;
  patient_gender?: "male" | "female" | "other";
  temperature?: string;
  blood_pressure?: string;
  blood_sugar?: string;
  symptoms: string;
  diagnosis: string;
  medications: string;
  lab_tests?: string;
  notes: string;
}

// const initialForm: CheckupFormData = {
//   patient_name: "",
//   patient_age: "",
//   patient_gender: "",
//   patient_medical_history: "",
//   symptoms: "",
//   diagnosis: "",
//   prescription: "",
//   notes: "",
// };

const formSchema = z.object({
  // patient_name is now optional
  patient_name: z.string().optional(), // Or z.string().nullable().optional() if it can be null

  // patient_age is required, coercing to number
  patient_age: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) =>
        val === undefined ||
        val === "" ||
        (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 120),
      {
        message: "Age must be a number between 0 and 120.",
      }
    ),

  // Corrected z.enum for patient_gender
  patient_gender: z
    .enum(["male", "female", "other"], {
      error: "Please select a gender.", // Use 'error' directly for simple message
    })
    .optional(),

  // temperature is optional
  temperature: z.string().trim().optional(),

  // blood_pressure is optional
  blood_pressure: z.string().trim().optional(),

  // blood_sugar is optional
  blood_sugar: z.string().trim().optional(),

  // symptoms is required
  symptoms: z.string().min(1, { message: "Symptoms are required." }),

  // diagnosis is required
  diagnosis: z.string().min(1, { message: "Diagnosis is required." }),

  // medications is required
  medications: z.string().min(1, { message: "Medications are required." }),

  // lab_tests is optional
  lab_tests: z.string().trim().optional(),

  // notes is required
  notes: z.string().min(1, { message: "Notes are required." }),
});

const CheckupFormRHF = () => {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patient_name: "",
      patient_age: "",
      patient_gender: undefined,
      symptoms: "",
      diagnosis: "",
      notes: "",
      temperature: "",
      blood_pressure: "",
      blood_sugar: "",
      medications: "",
      lab_tests: "",
    },
  });

  const { setIsUploading } = useUpload();

  // The onSubmit function
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Manual validation
    if (
      values.symptoms.trim() === "" ||
      values.diagnosis.trim() === "" ||
      values.medications.trim() === "" ||
      values.notes.trim() === ""
    ) {
      toast.error(
        "Please fill in all required fields: Medical History, Symptoms, Diagnosis, Prescription, and Notes."
      );
      return;
    }

    // Determine the final audio file (Blob)
    let finalAudioFile: Blob | null = null;
    if (recording || paused) {
      finalAudioFile = await stopRecording();
    } else if (audioFile) {
      finalAudioFile = audioFile as Blob;
    }

    // Use toast.promise() to manage the asynchronous operations and UI feedback
    toast.promise(
      (async () => {
        // This async function represents the entire submission process

        // --- 1. Audio Upload to Cloudinary (if file exists) ---
        let audioUrl: string | undefined;
        let audioPublicId: string | undefined;

        if (finalAudioFile) {
          toast.loading("Uploading audio...", { id: "audio-upload-progress" });
          setIsUploading(true); // Set uploading state to true

          const formData = new FormData();
          formData.append("files", finalAudioFile, "checkup_audio.webm");

          try {
            const response = await axios.post("/api/upload", formData);

            if (response.status < 200 || response.status >= 300) {
              throw new Error("Failed to upload audio file.");
            }
            const { result } = response.data;

            audioUrl = result[0].url;
            audioPublicId = result[0].public_id;

            toast.success("Audio uploaded!", { id: "audio-upload-progress" });
          } catch (error: any) {
            toast.error(
              `Audio upload failed: ${error.message || "Unknown error"}`,
              { id: "audio-upload-progress" }
            );
            throw error;
          }
        }

        // --- 2. Database Insert ---
        toast.loading("Saving checkup data...", { id: "db-save-progress" });

        const checkupData = {
          ...values,
          consultation_audio_url: audioUrl || null,
          audio_public_id: audioPublicId || null,
        };

        try {
          const checkupResponse = await axios.post("/api/checkup", checkupData);

          if (checkupResponse.status < 200 || checkupResponse.status >= 300) {
            throw new Error("Failed to submit checkup data to database.");
          }
          toast.success("Checkup data saved!", { id: "db-save-progress" });
          setIsUploading(false); // Set uploading state to false after saving
          return checkupResponse.data; // This data will be passed to the success callback
        } catch (error: any) {
          toast.error(
            `Database save failed: ${error.message || "Unknown error"}`,
            { id: "db-save-progress" }
          );
          throw error;
        }
      })(), // Immediately invoke the async function
      {
        loading: "Submitting checkup...", // Main loading message for the overall process
        success: (data) => {
          // Form clearing should still happen here, as it's specific to THIS form's submission success
          form.reset();
          return "Checkup submitted successfully!";
        },
        error: (err) => {
          console.error("Error submitting checkup:", err);
          return `Submission failed: ${err.message || "Please try again."}`;
        },
      }
    );

    // --- IMPORTANT CHANGE: Navigate immediately AFTER the toast.promise is initiated ---
    // router.push("/dashboard");

    console.log("Checkup data", values);

        const printableHTML = `
    <div class="font-sans border border-gray-200 rounded-lg p-5 w-full mx-auto bg-white shadow-sm">
      <div class="text-center mb-5 pb-4 border-b-2 border-blue-500">
        <h2 class="text-slate-800 m-0 text-2xl font-semibold">Patient Checkup Report</h2>
        <p class="text-gray-500 mt-1 text-sm">${new Date().toLocaleDateString()}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p class="font-medium text-gray-700">Name:</p>
          <p class="text-gray-900">${values.patient_name || "N/A"}</p>
        </div>
        <div>
          <p class="font-medium text-gray-700">Age:</p>
          <p class="text-gray-900">${values.patient_age || "N/A"}</p>
        </div>
        <div>
          <p class="font-medium text-gray-700">Gender:</p>
          <p class="text-gray-900">${values.patient_gender || "N/A"}</p>
        </div>
        <div>
          <p class="font-medium text-gray-700">Temperature:</p>
          <p class="text-gray-900">${values.temperature || "N/A"}</p>
        </div>
      </div>

      <div class="mt-6">
        <h3 class="text-lg font-semibold text-slate-700 border-b pb-2">Clinical Findings</h3>
        <div class="grid grid-cols-1 gap-4 mt-3">
          <div>
            <p class="font-medium text-gray-700">Blood Pressure:</p>
            <p class="text-gray-900">${values.blood_pressure || "N/A"}</p>
          </div>
          <div>
            <p class="font-medium text-gray-700">Blood Sugar:</p>
            <p class="text-gray-900">${values.blood_sugar || "N/A"}</p>
          </div>
          <div>
            <p class="font-medium text-gray-700">Symptoms:</p>
            <p class="text-gray-900 whitespace-pre-line">${
              values.symptoms || "N/A"
            }</p>
          </div>
        </div>
      </div>

      <div class="mt-6">
        <h3 class="text-lg font-semibold text-slate-700 border-b pb-2">Medical Assessment</h3>
        <div class="grid grid-cols-1 gap-4 mt-3">
          <div>
            <p class="font-medium text-gray-700">Diagnosis:</p>
            <p class="text-gray-900">${values.diagnosis || "N/A"}</p>
          </div>
          <div>
            <p class="font-medium text-gray-700">Medications:</p>
            <p class="text-gray-900 whitespace-pre-line">${
              values.medications || "N/A"
            }</p>
          </div>
          <div>
            <p class="font-medium text-gray-700">Lab Tests:</p>
            <p class="text-gray-900">${values.lab_tests || "N/A"}</p>
          </div>
          <div>
            <p class="font-medium text-gray-700">Notes:</p>
            <p class="text-gray-900 whitespace-pre-line">${
              values.notes || "N/A"
            }</p>
          </div>
        </div>
      </div>

      <div class="mt-8 pt-4 border-t text-xs text-gray-500 text-center">
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
    </div>
    `;

    // Create an invisible div and inject it to DOM

    const existingPrintEl = document.getElementById("printable-checkup");
    if (existingPrintEl) {
      document.body.removeChild(existingPrintEl);
    }

    const printContainer = document.createElement("div");
    printContainer.id = "printable-checkup";
    printContainer.innerHTML = printableHTML;

    printContainer.style.position = "fixed";
    printContainer.style.top = "0";
    printContainer.style.left = "0";
    printContainer.style.width = "100%";
    printContainer.style.height = "100%";
    printContainer.style.zIndex = "-1";

    document.body.appendChild(printContainer);

    // Trigger print
    setTimeout(() => {
      printJS({
        printable: "printable-checkup",
        type: "html",
        targetStyles: ["*"],
        onPrintDialogClose: () => {
          router.push("/dashboard");
          printContainer.remove();
        },
      });
    }, 1000);

    setTimeout(() => {
      router.push("/dashboard");
      printContainer.remove();
    }, 1000); // delay for 1 sec to allow print dialog to appear
  }

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);

  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);

  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [loading, setLoading] = useState(false);

  const { status } = useSession();
  const router = useRouter();

  useHotkeys(
    "esc",
    () => {
      router.push("/dashboard");
    },
    { enableOnFormTags: ["INPUT", "TEXTAREA"] }
  );

  useHotkeys(
    "ctrl+enter",
    () => {
      form.handleSubmit(onSubmit)();
    },
    { enableOnFormTags: ["INPUT", "TEXTAREA"], preventDefault: true }
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    console.log("Checkup Form mounted, status:", status);
    if (status === "authenticated") {
      console.log("Starting recording...");
      startRecording();
    }
    // return () => {
    //   if (recordingIntervalRef.current) {
    //     clearInterval(recordingIntervalRef.current);
    //     recordingIntervalRef.current = null;
    //   }
    //   if (mediaRecorder) {
    //     mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    //   }
    // };
  }, [status]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const localChunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        localChunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(localChunks, { type: "audio/webm" });
      audioBlobRef.current = blob;
      const file = new File([blob], "checkup_audio.webm", {
        type: "audio/webm",
      });
      setAudioFile(file);
    };

    recorder.start();
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    setMediaRecorder(recorder);
    setRecording(true);
    setPaused(false);
  };

  const pauseRecording = () => {
    if (mediaRecorder?.state === "recording") {
      mediaRecorder.pause();
      setPaused(true);
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder?.state === "paused") {
      mediaRecorder.resume();
      setPaused(false);
    }
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = (): Promise<File | null> => {
    return new Promise((resolve) => {
      if (mediaRecorder) {
        const localChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            localChunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
          }

          const blob = new Blob(localChunks, { type: "audio/webm" });
          audioBlobRef.current = blob;
          const file = new File([blob], "checkup_audio.webm", {
            type: "audio/webm",
          });
          setAudioFile(file);
          setRecording(false);
          setPaused(false);
          resolve(file);
        };

        mediaRecorder.stop();

        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
        setMediaRecorder(null);
      } else {
        resolve(null);
      }
    });
  };

  const autoFocusRef = useRef<(HTMLInputElement | HTMLTextAreaElement)[]>([]);

  useEffect(() => {
    autoFocusRef.current[0]?.focus();
  }, []);

  const handleEnter =
    (index: number) =>
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        autoFocusRef.current[index + 1]?.focus();
      }
    };

  // const fields = [
  //   { placeholder: "Ahmad (optional)", label: "Patient Name", name: "patient_name" },
  //   { placeholder: "Select or type", label: "Patient Gender", name: "patient_gender", select: true },
  //   { placeholder: "25", label: "Patient Age", name: "patient_age" },
  //   // { placeholder: "Allergies, chronic conditions, past surgeries...", label: "Medical History", name: "patient_medical_history", textarea: true },
  //   { placeholder: "Temperature", label: "Temperature", name: "temperature" },
  //   { placeholder: "Blood Pressure", label: "Blood Pressure", name: "blood_pressure" },
  //   { placeholder: "Blood Sugar", label: "Blood Sugar", name: "blood_sugar" },
  //   { placeholder: "Fever, cough, headache...", label: "Symptoms", name: "symptoms", textarea: true },
  //   { placeholder: "Common cold, flu, bronchitis...", label: "Diagnosis", name: "diagnosis", textarea: true },
  //   // { placeholder: "Paracetamol 500mg, twice daily...", label: "Prescription", name: "prescription", textarea: true },
  //   { placeholder: "Paracetamol 500mg, once daily...", label: "Medication", name: "medications", textarea: true },
  //   { placeholder: "CBC, BMP, LFT...", label: "Lab Tests", name: "lab_tests", textarea: true },

  //   { placeholder: "Patient is responding well to treatment...", label: "Notes", name: "notes", textarea: true },
  // ];

  if (status === "loading") {
    return <Loading />;
  }

  if (status === "unauthenticated") {
    return null;
  }

  const fields = [
    // Patient Information Section
    {
      placeholder: "Ahmad (optional)",
      label: "Patient Name",
      name: "patient_name",
      colSpan: 1,
    },
    {
      placeholder: "Select or type",
      label: "Patient Gender",
      name: "patient_gender",
      select: true,
      colSpan: 1,
    },
    {
      placeholder: "25",
      label: "Patient Age",
      name: "patient_age",
      colSpan: 1,
    },

    // Medical History Section - Vital Signs
    {
      placeholder: "36.5°C",
      label: "Temperature",
      name: "temperature",
      colSpan: 1,
      icon: <Thermometer className="h-4 w-4 mr-2 opacity-50" />,
    },
    {
      placeholder: "120/80 mmHg",
      label: "Blood Pressure",
      name: "blood_pressure",
      colSpan: 1,
      icon: <HeartPulse className="h-4 w-4 mr-2 opacity-50" />,
    },
    {
      placeholder: "90 mg/dL",
      label: "Blood Sugar",
      name: "blood_sugar",
      colSpan: 1,
      icon: <Droplet className="h-4 w-4 mr-2 opacity-50" />,
    },

    // Symptoms and Diagnosis
    {
      placeholder: "Fever, cough, headache...",
      label: "Symptoms",
      name: "symptoms",
      textarea: true,
      colSpan: 3,
    },
    {
      placeholder: "Common cold, flu, bronchitis...",
      label: "Diagnosis",
      name: "diagnosis",
      textarea: true,
      colSpan: 3,
    },

    // Treatment Section
    {
      placeholder: "Paracetamol 500mg, once daily...",
      label: "Medication",
      name: "medications",
      textarea: true,
      colSpan: 2,
    },
    {
      placeholder: "CBC, BMP, LFT...",
      label: "Lab Tests",
      name: "lab_tests",
      textarea: true,
      colSpan: 1,
    },

    // Notes
    {
      placeholder: "Patient is responding well to treatment...",
      label: "Notes",
      name: "notes",
      textarea: true,
      colSpan: 3,
    },
  ];

  return (
    <div className="p-6">
      <Card className="max-w-6xl mx-auto shadow-lg border border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex w-full items-center justify-between">
            <Button
              type="button"
              variant="outline"
              className="text-base font-semibold cursor-pointer focus-visible:ring-pink-500 justify-self-start"
              onClick={() => router.push("/dashboard")}
              disabled={loading}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-2 text-xs tracking-wide text-muted-foreground">
                Esc
              </span>
            </Button>
            <div className="place-self-center">
              <CardTitle className="text-3xl font-bold text-center">
                Patient Checkup Form
              </CardTitle>
            </div>
            <div className="w-24"> {/* Spacer for balance */} </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Audio Controls */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-sm text-muted-foreground">
              Press 'Tab' to navigate fields
            </span>
            <div className="flex items-center gap-4">
              {recording ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-red-600 font-medium">
                    <span className="bg-red-500 w-3 h-3 rounded-full animate-pulse" />
                    Recording
                  </div>
                  <span className="text-sm text-gray-500">
                    {`${Math.floor(recordingTime / 60)
                      .toString()
                      .padStart(2, "0")}:${(recordingTime % 60)
                      .toString()
                      .padStart(2, "0")}`}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-gray-500">Ready to record</span>
              )}
            </div>
          </div>

          <Form {...form}>
            <FocusTrap active={true}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                {/* Patient Information Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">
                    Patient Information
                  </h3>
                  <div className="grid grid-cols-3 gap-6">
                    {fields.slice(0, 3).map((_field) => (
                      <FormField
                        key={_field.name}
                        control={form.control}
                        name={_field.name as keyof CheckupFormData}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{_field.label}</FormLabel>
                            {_field.select ? (
                              <FormField
                                control={form.control}
                                name={_field.name as keyof CheckupFormData}
                                render={({ field }) => (
                                  <Select
                                    disabled={loading}
                                    onValueChange={field.onChange}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="w-full focus-visible:ring-blue-500 focus-visible:ring-1 focus-visible:border-0">
                                        <SelectValue placeholder="Select Gender" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="male">Male</SelectItem>
                                      <SelectItem value="female">
                                        Female
                                      </SelectItem>
                                      <SelectItem value="other">
                                        Other
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            ) : (
                              <FormControl>
                                <Input
                                  placeholder={_field.placeholder}
                                  className="h-12"
                                  disabled={loading}
                                  {...field}
                                />
                              </FormControl>
                            )}
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Medical History Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">
                    Medical History & Vital Signs
                  </h3>
                  <div className="grid grid-cols-3 gap-6">
                    {fields.slice(3, 6).map((_field) => (
                      <FormField
                        key={_field.name}
                        control={form.control}
                        name={_field.name as keyof CheckupFormData}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{_field.label}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                {_field.icon && (
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2">
                                    {_field.icon}
                                  </span>
                                )}
                                <Input
                                  placeholder={_field.placeholder}
                                  className="h-12 pl-10"
                                  disabled={loading}
                                  {...field}
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Symptoms and Diagnosis */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">
                    Clinical Assessment
                  </h3>
                  {fields.slice(6, 8).map((_field) => (
                    <FormField
                      key={_field.name}
                      control={form.control}
                      name={_field.name as keyof CheckupFormData}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{_field.label}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={_field.placeholder}
                              className="min-h-[120px]"
                              disabled={loading}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>

                {/* Treatment Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">
                    Treatment Plan
                  </h3>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name="medications"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medication</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Paracetamol 500mg, once daily..."
                                className="min-h-[120px]"
                                disabled={loading}
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FormField
                        control={form.control}
                        name="lab_tests"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lab Tests</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="CBC, BMP, LFT..."
                                className="min-h-[120px]"
                                disabled={loading}
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">
                    Additional Notes
                  </h3>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Patient is responding well to treatment..."
                            className="min-h-[120px]"
                            disabled={loading}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit Section */}
                <div className="flex flex-col items-end gap-3 pt-6">
                  <Button
                    type="submit"
                    className="h-12 px-8 text-lg font-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Submit Checkup"
                    )}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Press 'Ctrl+Enter' to Submit
                  </span>
                </div>
              </form>
            </FocusTrap>
          </Form>

          {/* Privacy Notice */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-muted-foreground text-justify">
              By submitting this form, you agree to our{" "}
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-primary hover:text-primary/80 cursor-pointer"
              >
                Privacy Policy
              </a>
              . We collect and store your voice recordings and any information
              provided in this form for research and development purposes aimed
              at improving healthcare technology. Your data may be used to train
              and enhance AI models that assist in healthcare insights and
              diagnostics. All data will be stored securely and will not be
              shared with unauthorized third parties.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckupFormRHF;
