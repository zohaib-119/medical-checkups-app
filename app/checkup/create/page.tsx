"use client";

import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Pause, Play } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Loading from "@/components/Loading";
import { toast } from "sonner";

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
    { label: "Patient Gender", name: "patient_gender", select: true },
    { label: "Patient Name", name: "patient_name" },
    { label: "Patient Age", name: "patient_age" },
    { label: "Medical History", name: "patient_medical_history" },
    { label: "Symptoms", name: "symptoms" },
    { label: "Diagnosis", name: "diagnosis" },
    { label: "Prescription", name: "prescription" },
    { label: "Notes", name: "notes", textarea: true },
  ];

  if (status === "loading") {
    return <Loading />;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <Card className="max-w-2xl mx-auto mt-10 shadow-lg border border-gray-200">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-center">
          Patient Checkup Form
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Audio Controls */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            {recording && (
              <span className="flex items-center gap-1 text-red-600 font-medium">
                <span className="bg-red-500 w-3 h-3 rounded-full animate-pulse" />
                Recording
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
          <div className="flex gap-2">
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

        <form onSubmit={onSubmit} className="space-y-5">
          {fields.map((field, index) => (
            <div key={field.name} className="space-y-1">
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
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                  className="resize-none"
                  rows={3}
                  disabled={loading}
                />
              ) : field.select ? (
                <Select
                  onValueChange={onGenderChange}
                  value={form.patient_gender}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
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
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                  type={field.name === "patient_age" ? "number" : "text"}
                  min={field.name === "patient_age" ? 0 : undefined}
                  disabled={loading}
                />
              )}
            </div>
          ))}
          <div className="w-full flex items-center gap-2 justify-end mt-6">
            <Button
              type="submit"
              className="text-base font-semibold cursor-pointer flex-grow"
              disabled={loading}
            >
              {loading ? "Submitting" : "Submit Checkup"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-base font-semibold cursor-pointer"
              onClick={() => router.push("/dashboard")}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CheckupForm;
