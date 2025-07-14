"use client";

import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FocusTrap } from 'focus-trap-react';
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
import { ChevronLeft, Pause, Play } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Loading from "@/components/Loading";
import { toast } from "sonner";
import { useHotkeys } from 'react-hotkeys-hook';
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"


interface CheckupFormData {
  patient_name: string;
  patient_age?: number;
  patient_gender?: "male" | "female" | "other";
  patient_medical_history: string;
  symptoms: string;
  diagnosis: string;
  prescription: string;
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
      (val) => val === undefined || val === "" || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 120),
      {
        message: "Age must be a number between 0 and 120.",
      }
    ),

  // Corrected z.enum for patient_gender
  patient_gender: z.enum(["male", "female", "other"], {
    error: "Please select a gender.", // Use 'error' directly for simple message
  })
    .optional(),

  // patient_medical_history is required
  patient_medical_history: z.string().min(1, { message: "Medical history is required." }),

  // symptoms is required
  symptoms: z.string().min(1, { message: "Symptoms are required." }),

  // diagnosis is required
  diagnosis: z.string().min(1, { message: "Diagnosis is required." }),

  // prescription is required
  prescription: z.string().min(1, { message: "Prescription is required." }),

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
      patient_medical_history: "",
      symptoms: "",
      diagnosis: "",
      prescription: "",
      notes: ""
    },
  })

  // The onSubmit function
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Manual validation
    if (
      values.symptoms === "" ||
      values.diagnosis === "" ||
      values.prescription === "" ||
      values.notes === ""
    ) {
      toast.error(
        "Please fill in all required fields: Symptoms, Diagnosis, Prescription, and Notes."
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
            toast.error(`Audio upload failed: ${error.message || 'Unknown error'}`, { id: "audio-upload-progress" });
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
          return checkupResponse.data; // This data will be passed to the success callback
        } catch (error: any) {
          toast.error(`Database save failed: ${error.message || 'Unknown error'}`, { id: "db-save-progress" });
          throw error;
        }

      })(), // Immediately invoke the async function
      {
        loading: 'Submitting checkup...', // Main loading message for the overall process
        success: (data) => {
          // Form clearing should still happen here, as it's specific to THIS form's submission success
          form.reset();
          return "Checkup submitted successfully!";
        },
        error: (err) => {
          console.error("Error submitting checkup:", err);
          return `Submission failed: ${err.message || 'Please try again.'}`;
        },
      }
    );

    // --- IMPORTANT CHANGE: Navigate immediately AFTER the toast.promise is initiated ---
    router.push("/dashboard");
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

  useHotkeys('esc', () => {
    router.push("/dashboard")
  }, { enableOnFormTags: ['INPUT', 'TEXTAREA'] });

  useHotkeys('ctrl+enter', () => {
    form.handleSubmit(onSubmit)()
  }, { enableOnFormTags: ['INPUT', 'TEXTAREA'], preventDefault: true });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "loading" || status === "unauthenticated") {
      return;
    }
    startRecording();
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      if (mediaRecorder) {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      }
    };
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

  const fields = [
    { placeholder: "Ahmad (optional)", label: "Patient Name", name: "patient_name" },
    { placeholder: "Select or type", label: "Patient Gender", name: "patient_gender", select: true },
    { placeholder: "25", label: "Patient Age", name: "patient_age" },
    { placeholder: "Allergies, chronic conditions, past surgeries...", label: "Medical History", name: "patient_medical_history", textarea: true },
    { placeholder: "Fever, cough, headache...", label: "Symptoms", name: "symptoms", textarea: true },
    { placeholder: "Common cold, flu, bronchitis...", label: "Diagnosis", name: "diagnosis", textarea: true },
    { placeholder: "Paracetamol 500mg, twice daily...", label: "Prescription", name: "prescription", textarea: true },
    { placeholder: "Patient is responding well to treatment...", label: "Notes", name: "notes", textarea: true },
  ];

  if (status === "loading") {
    return <Loading />;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="max-w-5xl mx-auto shadow-lg border border-gray-200">
        <CardHeader>
          <div className="flex w-full items-center justify-between">
            <Button
              type="button"
              variant="outline"
              className="text-base font-semibold cursor-pointer focus-visible:ring-pink-500 justify-self-start"
              onClick={() => router.push("/dashboard")}
              disabled={loading}
            >
              <ChevronLeft />
              <span className="text-xs tracking-wide text-muted-foreground">
                Esc
              </span>
            </Button>
            <div className="place-self-center">
              <CardTitle className="text-2xl font-semibold text-center">
                Patient Checkup Form
              </CardTitle>
            </div>
            <div>

            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Audio Controls */}
          <div className="flex items-center gap-3 mb-6 justify-between">
            <span className="text-xs tracking-wide text-muted-foreground">
              Press 'Tab' to navigate
            </span>
            <div className="flex items-center gap-2">
              {recording && (
                <span className="flex items-center gap-1 text-red-600 font-medium select-none">
                  <span className="bg-red-500 w-3 h-3 rounded-full animate-pulse" />
                  Recording Audio
                  <span className="ml-2 text-xs text-gray-500">
                    {`${Math.floor(recordingTime / 60)
                      .toString()
                      .padStart(2, "0")}:${(recordingTime % 60)
                        .toString()
                        .padStart(2, "0")}`}
                  </span>
                </span>
              )}
              {!recording && (
                <span className="text-gray-500 text-sm">Audio not recording</span>
              )}
            </div>

            <div className="hidden gap-2">
              {recording && !paused && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Pause Recording"
                  onClick={pauseRecording}
                  disabled={loading}
                >
                  <Pause />
                </Button>
              )}
              {recording && paused && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Resume Recording"
                  onClick={resumeRecording}
                  disabled={loading}
                >
                  <Play />
                </Button>
              )}
            </div>
          </div>

          <Form {...form}>
            <FocusTrap active={true}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 grid grid-cols-3 gap-2">
                {fields.map((_field, index) => (
                  <div key={_field.name} className="space-y-2">
                    {_field.textarea ? (
                      <FormField
                        control={form.control}
                        name={_field.name as keyof CheckupFormData}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{_field.label}</FormLabel>
                            <FormControl>
                              {/* <Input placeholder="shadcn" {...field} /> */}
                              <Textarea
                                {...field}
                                // onKeyDown={handleEnter(index)}
                                // ref={(el) => {
                                //   if (el) autoFocusRef.current[index] = el;
                                // }}
                                placeholder={`${_field.placeholder}`}
                                className="resize-none focus-visible:ring-blue-500 focus-visible:ring-1 focus-visible:border-0"
                                rows={3}
                                disabled={loading}
                              />
                            </FormControl>
                            <FormDescription>
                            </FormDescription>
                            {/* <FormMessage /> */}
                          </FormItem>
                        )}
                      />
                    ) : _field.select ? (
                      <FormField
                        control={form.control}
                        name={_field.name as keyof CheckupFormData}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{_field.label}</FormLabel>
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
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={form.control}
                        name={_field.name as keyof CheckupFormData}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{_field.label}</FormLabel>
                            <FormControl>
                              <Input
                                // onKeyDown={handleEnter(index)}
                                // ref={(el) => {
                                //   if (el) autoFocusRef.current[index] = el;
                                // }}
                                placeholder={`${_field.placeholder}`}
                                // type={_field.name === "patient_age" ? "number" : "text"}
                                type={"text"}
                                min={_field.name === "patient_age" ? 0 : undefined}
                                disabled={loading}
                                className="focus-visible:ring-blue-500 focus-visible:ring-1 focus-visible:border-0"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                ))}
                <div className="w-full flex flex-col items-end gap-2 justify-center">
                  <Button
                    type="submit"
                    className="text-base font-semibold cursor-pointer focus-visible:ring-pink-500 h-10 px-8"
                    disabled={loading}
                  >
                    {loading ? "Submitting" : "Submit Checkup"}
                  </Button>
                  <span className="text-xs tracking-wide text-muted-foreground">
                    Press 'Ctrl+Enter' to Submit
                  </span>
                  {/* <Button
                  type="button"
                  variant="outline"
                  className="text-base font-semibold cursor-pointer focus-visible:ring-pink-500 h-12"
                  onClick={() => router.push("/dashboard")}
                  disabled={loading}
                >
                  Cancel
                </Button> */}
                </div>
              </form>
            </FocusTrap>
          </Form>
          <div className="w-full px-1">
            <p className="text-[12px] text-muted-foreground mt-2 text-justify select-none">
              By submitting this form, you agree to our{" "}
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-primary hover:text-primary/80 cursor-pointer"
              >
                Privacy Policy
              </a>
              . We collect and store your voice recordings and any information provided in
              this form for research and development purposes aimed at improving healthcare
              technology. Your data may be used to train and enhance AI models that assist
              in healthcare insights and diagnostics. All data will be stored securely and
              will not be shared with unauthorized third parties.
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default CheckupFormRHF;
