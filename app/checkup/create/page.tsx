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

interface CheckupFormData {
  patient_name: string;
  patient_age: string;
  patient_gender: string;
  patient_medical_history: string;
  symptoms: string;
  diagnosis: string;
  prescription: string;
  notes: string;
}

const initialForm: CheckupFormData = {
  patient_name: "",
  patient_age: "",
  patient_gender: "",
  patient_medical_history: "",
  symptoms: "",
  diagnosis: "",
  prescription: "",
  notes: "",
};

const CheckupForm = () => {
  const [form, setForm] = useState<CheckupFormData>(initialForm);

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
    const mockEvent: React.FormEvent<HTMLFormElement> = {
      preventDefault: () => { }, // Provide an empty function for preventDefault
      // You can add other properties if your onSubmit handler uses them,
      // e.g., currentTarget: document.createElement('form') as HTMLFormElement,
      // target: document.createElement('form') as EventTarget & HTMLFormElement,
      // type: 'submit',
      // nativeEvent: new Event('submit'), // If you really need the native event
    } as React.FormEvent<HTMLFormElement>;
    onSubmit(mockEvent)
  }, { enableOnFormTags: ['INPUT', 'TEXTAREA'] });

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

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onGenderChange = (value: string) => {
    setForm((prev) => ({ ...prev, patient_gender: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      form.symptoms === "" ||
      form.diagnosis === "" ||
      (form.prescription === "" && form.notes === "")
    ) {
      toast.error(
        "Please fill in all required fields: Symptoms, Diagnosis, and either Prescription or Notes."
      );
      return;
    }

    let file = audioFile;

    if (recording || paused) {
      file = await stopRecording();
    }

    console.log("Form Data:", form);
    console.log("Audio File:", file);

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("files", file as Blob, "checkup_audio.webm");
      const response = await axios.post("/api/upload", formData);

      if (response.status < 200 || response.status >= 300) {
        throw new Error("Failed to upload images");
      }
      const { result } = response.data;

      const audioUrl = result[0].url;
      const audioPublicId = result[0].public_id;

      const checkupData = {
        ...form,
        consultation_audio_url: audioUrl,
        audio_public_id: audioPublicId,
      };
      const checkupResponse = await axios.post("/api/checkup", checkupData);
      if (checkupResponse.status < 200 || checkupResponse.status >= 300) {
        throw new Error("Failed to submit checkup data");
      }
      toast.success("Checkup submitted successfully!");
      router.replace("/dashboard");
    } catch (error) {
      console.error("Error submitting checkup:", error);
    } finally {
      setLoading(false);
    }
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
    { placeholder: "Select or type", label: "Patient Gender", name: "patient_gender", select: true },
    { placeholder: "Ahmad (optional)", label: "Patient Name", name: "patient_name" },
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

          <FocusTrap active={true}>
            <form onSubmit={onSubmit} className="space-y-5 grid grid-cols-3 gap-2">
              {fields.map((field, index) => (
                <div key={field.name} className="space-y-2">
                  <Label className="font-medium">{field.label}</Label>
                  {field.textarea ? (
                    <Textarea
                      name={field.name}
                      value={form[field.name as keyof CheckupFormData]}
                      onChange={onChange}
                      onKeyDown={handleEnter(index)}
                      ref={(el) => {
                        if (el) autoFocusRef.current[index] = el;
                      }}
                      placeholder={`${field.placeholder}`}
                      className="resize-none focus-visible:ring-blue-500 focus-visible:ring-1 focus-visible:border-0"
                      rows={3}
                      disabled={loading}
                    />
                  ) : field.select ? (
                    <Select
                      onValueChange={onGenderChange}
                      value={form.patient_gender}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-full focus-visible:ring-blue-500 focus-visible:ring-1 focus-visible:border-0">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      name={field.name}
                      value={form[field.name as keyof CheckupFormData]}
                      onChange={onChange}
                      onKeyDown={handleEnter(index)}
                      ref={(el) => {
                        if (el) autoFocusRef.current[index] = el;
                      }}
                      placeholder={`${field.placeholder}`}
                      type={field.name === "patient_age" ? "number" : "text"}
                      min={field.name === "patient_age" ? 0 : undefined}
                      disabled={loading}
                      className="focus-visible:ring-blue-500 focus-visible:ring-1 focus-visible:border-0"
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

export default CheckupForm;
