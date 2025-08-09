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
  TestTube,
  StickyNote,
  FileText,
  Shield,
  Send,
  Keyboard,
  Pill,
  Scale,
  Heart,
  AlertCircle,
  Stethoscope,
  Users,
  Calendar,
  UserCheck,
  User,
  Mic,
  Activity,
  History,
  CircleCheckBig,
  ShieldPlus,
  Weight
} from "lucide-react";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";
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
import { useReactToPrint } from "react-to-print";
import { Prescription } from "@/components/Prescription";


interface CheckupFormData {
  patient_name: string;
  patient_age?: number;
  patient_gender?: "male" | "female" | "other";
  temperature?: string;
  blood_pressure?: string;
  blood_sugar?: string;
  body_weight?: string;
  symptoms: string;
  diagnosis: string;
  medications?: string;
  lab_tests?: string;
  notes: string;
}


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

  // blood_sugar is optional
  body_weight: z.string().trim().optional(),

  // symptoms is required
  symptoms: z.string().min(1, { message: "Symptoms are required." }),

  // diagnosis is required
  diagnosis: z.string().min(1, { message: "Diagnosis is required." }),

  // medications is optional
  medications: z.string().optional(),

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
      body_weight: "",
      medications: "",
      lab_tests: "",
    },
  });

  const { setIsUploading } = useUpload();

  // The onSubmit function
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmitting(true)
    // Manual validation
    if (
      values.symptoms.trim() === "" ||
      values.diagnosis.trim() === "" ||
      values.notes.trim() === ""
    ) {
      toast.error(
        "Please fill in all required fields: Symptoms, Diagnosis and Notes."
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

    if (autoPrint === true) {
      handlePrint()
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

    router.push("/dashboard");
  }

  const [autoPrint, setAutoPrint] = useState(false);

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);

  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);

  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const pathname = usePathname();

  const [submitting, setSubmitting] = useState(false);

  const printableRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const handlePrint = useReactToPrint({ contentRef: printableRef });

  const { data: session, status } = useSession();

  const user = session?.user as {
    name: string;
  };

  useHotkeys(
    "esc",
    () => {
      stopRecording()
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
    const storedAutoPrint = localStorage.getItem("auto-print-checkups-app");
    if (storedAutoPrint) {
      setAutoPrint(storedAutoPrint === "true");
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    stopRecording()
    console.log("Checkup Form mounted, status:", status);
    if (status === "authenticated") {
      console.log("Starting recording...");
      startRecording();
    }
  }, [status]);

  // Runs before client-side route changes
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [pathname]);

  // Runs before browser unload (refresh, close, some back navigations)
  useEffect(() => {
    const handleBeforeUnload = () => {
      stopRecording();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

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


  if (status === "loading") {
    return <Loading />;
  }

  if (status === "unauthenticated") {
    return null;
  }

  const fields = [
    // Patient Information Section
    {
      placeholder: "John (optional)",
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
      placeholder: "98.6 °F",
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
    {
      placeholder: "70 kg",
      label: "Body Weight",
      name: "body_weight",
      colSpan: 1,
      icon: <Weight className="h-4 w-4 mr-2 opacity-50" />,
    },

    // Symptoms and Diagnosis
    {
      placeholder: "Fever, cough, headache...",
      label: "Symptoms *",
      name: "symptoms",
      textarea: true,
      colSpan: 3,
    },
    {
      placeholder: "Common cold, flu, bronchitis...",
      label: "Diagnosis *",
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
      label: "Notes *",
      name: "notes",
      textarea: true,
      colSpan: 3,
    },
  ];

  return (
    <div className="p-3 bg-gray-100 min-h-screen">
      <Card className="max-w-8xl mx-auto shadow-2xl border-0 bg-white/90 backdrop-blur-md">
        <CardHeader className="">
          <div className="flex w-full items-center justify-between">
            <div className="items-center flex gap-4">
              <Button
                variant="outline"
                className="text-base font-semibold cursor-pointer focus-visible:ring-pink-500 justify-self-start border-gray-300/30 text-gray-800 hover:bg-white/30"
                onPointerDown={(e) => {
                  stopRecording()
                  router.push('/dashboard');
                }}
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="ml-2 text-sm tracking-wide">
                  Esc
                </span>
              </Button>
              <div className="text-xs text-muted-foreground">
                Auto-Print: {autoPrint === true ? "ON" : "OFF"}
              </div>
            </div>
            <div className="place-self-center">
              <CardTitle className="text-2xl font-bold text-center flex items-center gap-3">
                <Stethoscope className="h-7 w-7" />
                Patient Checkup Form
                {/* <Heart className="h-8 w-8 text-red-300" /> */}
              </CardTitle>
            </div>

            <div className="flex items-center gap-4">
              {recording ? (
                <div className="flex items-center gap-3 bg-red-300/20 px-4 py-2 rounded-full">
                  <div className="flex items-center gap-2 text-red-800 font-medium">
                    {/* <span className="bg-red-400 w-3 h-3 rounded-full animate-pulse" /> */}
                    <Mic className="h-4 w-4 text-red-800 animate-pulse" />
                    Recording
                  </div>
                  <span className="text-sm text-red-800 font-normal tracking-wide">
                    {`${Math.floor(recordingTime / 60)
                      .toString()
                      .padStart(2, "0")}:${(recordingTime % 60)
                        .toString()
                        .padStart(2, "0")}`}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-full">
                  <Mic className="h-4 w-4 text-green-800" />
                  <span className="text-sm text-green-800 font-medium">Ready to record</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6">
          <Form {...form}>
            <FocusTrap active={true}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-4 gap-8">
                  <div className="col-span-3 space-y-4">
                    {/* Patient Information Section */}
                    <div className="space-y-4 bg-blue-50/50 py-4 px-6 rounded-xl border-l-4 border-blue-500">
                      <h3 className="text-lg font-bold text-blue-700 tracking-wide uppercase border-b-2 border-blue-200 pb-2 flex items-center gap-3">
                        <User className="h-5 w-5" />
                        Patient Information
                      </h3>
                      <div className="grid grid-cols-3 gap-8">
                        {fields.slice(0, 3).map((_field) => (
                          <FormField
                            key={_field.name}
                            control={form.control}
                            name={_field.name as keyof CheckupFormData}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base font-semibold text-gray-700 flex items-center gap-2">
                                  {_field.name === 'name' && <UserCheck className="h-4 w-4" />}
                                  {_field.name === 'age' && <Calendar className="h-4 w-4" />}
                                  {_field.name === 'gender' && <Users className="h-4 w-4" />}
                                  {_field.label}
                                </FormLabel>
                                {_field.select ? (
                                  <FormField
                                    control={form.control}
                                    name={_field.name as keyof CheckupFormData}
                                    render={({ field }) => (
                                      <Select
                                        disabled={submitting}
                                        onValueChange={field.onChange}
                                      >
                                        <FormControl>
                                          <SelectTrigger tabIndex={1} className="w-full min-h-10 text-base focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-300 bg-white">
                                            <SelectValue placeholder="Select Gender" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="male">Male</SelectItem>
                                          <SelectItem value="female">Female</SelectItem>
                                          <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    )}
                                  />
                                ) : (
                                  <FormControl>
                                    <Input
                                      placeholder={_field.placeholder}
                                      className="h-10 text-base md:text-base focus-visible:ring-blue-500 focus-visible:ring-2 focus-visible:border-blue-300 bg-white"
                                      disabled={submitting}
                                      {...field}
                                      tabIndex={1}
                                    />
                                  </FormControl>
                                )}
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Symptoms and Diagnosis */}
                    <div className="space-y-4 bg-red-50/50 py-4 px-6 rounded-xl border-l-4 border-red-500">
                      <h3 className="text-lg font-bold text-red-700 tracking-wide uppercase border-b-2 border-red-200 pb-2 flex items-center gap-3">
                        <Stethoscope className="h-5 w-5" />
                        Clinical Assessment
                      </h3>
                      <div className="grid grid-cols-2 gap-8">
                        {fields.slice(7, 9).map((_field) => (
                          <FormField
                            key={_field.name}
                            control={form.control}
                            name={_field.name as keyof CheckupFormData}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base font-semibold text-gray-700 flex items-center gap-2">
                                  {_field.name === 'symptoms' && <AlertCircle className="h-4 w-4" />}
                                  {_field.name === 'diagnosis' && <FileText className="h-4 w-4" />}
                                  {_field.label}
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder={_field.placeholder}
                                    className="min-h-24 text-base md:text-base focus-visible:ring-red-500 focus-visible:ring-2 focus-visible:border-red-300 bg-white"
                                    disabled={submitting}
                                    tabIndex={3}
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Medical History Section */}
                  <div className="space-y-8 bg-green-50/50 py-4 px-6 rounded-xl border-l-4 border-green-500">
                    <h3 className="text-lg font-bold text-green-700 tracking-wide uppercase border-b-2 border-green-200 pb-2 flex items-center gap-3">
                      <Activity className="h-5 w-5" />
                      HISTORY & VITALS
                    </h3>
                    <div className="space-y-4">
                      {fields.slice(3, 7).map((_field) => (
                        <FormField
                          key={_field.name}
                          control={form.control}
                          name={_field.name as keyof CheckupFormData}
                          render={({ field }) => (
                            <FormItem className="grid grid-cols-5">
                              <FormLabel className="text-base md:text-base font-semibold text-gray-700 flex items-center gap-2 col-span-2">
                                {_field.label}
                              </FormLabel>
                              <FormControl >
                                <div className="relative col-span-3">
                                  {_field.icon && (
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600">
                                      {_field.icon}
                                    </span>
                                  )}
                                  <Input
                                    placeholder={_field.placeholder}
                                    className="h-12 pl-10 text-base focus-visible:ring-green-500 focus-visible:ring-2 focus-visible:border-green-300 bg-white"
                                    disabled={submitting}
                                    tabIndex={2}
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      ))}

                      {/* New Body Weight Field */}
                      {/* <FormField
                        control={form.control}
                        name="body_weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold text-gray-700 flex items-center gap-2">
                              <Scale className="h-4 w-4" />
                              Body Weight
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600">
                                  <Scale className="h-4 w-4" />
                                </span>
                                <Input
                                  placeholder="70 kg"
                                  className="h-12 pl-10 text-base focus-visible:ring-green-500 focus-visible:ring-2 focus-visible:border-green-300 bg-white"
                                  disabled={loading}
                                  tabIndex={2}
                                  {...field}
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      /> */}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-8">
                  {/* Treatment Section */}
                  <div className="space-y-4 col-span-2 bg-purple-50/50 py-4 px-6 rounded-xl border-l-4 border-purple-500">
                    <h3 className="text-lg font-bold text-purple-700 tracking-wide uppercase border-b-2 border-purple-200 pb-2 flex items-center gap-3">
                      <ShieldPlus className="h-5 w-5" />
                      Treatment Plan
                    </h3>
                    <div className="grid grid-cols-3 gap-8">
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name="medications"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold text-gray-700 flex items-center gap-2">
                                <Pill className="h-4 w-4" />
                                Medication
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Paracetamol 500mg, once daily..."
                                  className="min-h-24 text-base md:text-base focus-visible:ring-purple-500 focus-visible:ring-2 focus-visible:border-purple-300 bg-white"
                                  disabled={submitting}
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
                              <FormLabel className="text-base font-semibold text-gray-700 flex items-center gap-2">
                                <TestTube className="h-4 w-4" />
                                Lab Tests
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="CBC, BMP, LFT..."
                                  className="min-h-24 text-base md:text-base focus-visible:ring-purple-500 focus-visible:ring-2 focus-visible:border-purple-300 bg-white"
                                  disabled={submitting}
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
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4 col-span-2 bg-orange-50/50 py-4 px-6 rounded-xl border-l-4 border-orange-500">
                      <h3 className="text-lg font-bold text-orange-700 tracking-wide uppercase border-b-2 border-orange-200 pb-2 flex items-center gap-3">
                        <StickyNote className="h-5 w-5" />
                        Additional Notes
                      </h3>
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold text-gray-700 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Notes *
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Patient is responding well to treatment..."
                                className="min-h-24 text-base md:text-base focus-visible:ring-orange-500 focus-visible:ring-2 focus-visible:border-orange-300 bg-white"
                                disabled={submitting}
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex w-full gap-8 items-end">
                  {/* Privacy Notice */}
                  <div className="p-5 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl w-full border border-gray-200">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                      <p className="text-sm text-gray-700 leading-relaxed">
                        By submitting this form, you agree to our{" "}
                        <a
                          href="/privacy-policy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                          tabIndex={-1}
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
                  </div>

                  {/* Submit Section */}
                  <div className="flex flex-col items-end justify-end gap-4">
                    <Button
                      type="submit"
                      className="h-14 px-10 text-lg cursor-pointer font-bold focus-visible:ring-teal-700 focus-visible:ring-4 focus-visible:border-0 bg-teal-600 hover:bg-teal-700 shadow-lg"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <CircleCheckBig className="h-5 w-5" />
                          Submit Checkup
                        </div>
                      )}
                    </Button>
                    <span className="text-sm text-gray-500 font-medium flex items-center gap-1">
                      <Keyboard className="h-4 w-4" />
                      Press 'Ctrl+Enter' to Submit
                    </span>
                  </div>
                </div>
              </form>
            </FocusTrap>
          </Form>
        </CardContent>
      </Card>
      {submitting && (
        <div className="hidden">
          <Prescription ref={printableRef} checkup={{ created_at: new Date().toISOString(), doctor_name: user.name, ...form.getValues() }} />
        </div>
      )}
    </div>
  );
};

export default CheckupFormRHF;
