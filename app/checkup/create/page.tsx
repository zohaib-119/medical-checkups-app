'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface CheckupFormData {
  patient_name: string;
  patient_age: string;
  patient_gender: string;
  patient_medical_history: string;
  symptoms: string;
  digonis: string;
  prescript: string;
  notes: string;
}

const CheckupForm = () => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckupFormData>();

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);

  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        setAudioChunks((prev) => [...prev, e.data]);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      audioBlobRef.current = blob;
      const file = new File([blob], "checkup_audio.webm", { type: "audio/webm" });
      setAudioFile(file);
      setAudioChunks([]);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setRecording(true);
    setPaused(false);
  };

  const pauseRecording = () => {
    if (mediaRecorder?.state === "recording") {
      mediaRecorder.pause();
      setPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder?.state === "paused") {
      mediaRecorder.resume();
      setPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
      setPaused(false);
    }
  };

  const onSubmit = (data: CheckupFormData) => {
    if (recording && mediaRecorder?.state !== "inactive") {
      stopRecording();
    }

    setTimeout(() => {
      console.log("Form Data:", data);
      console.log("Audio File:", audioFile);
      // You can now send `data` + `audioFile` to your backend
    }, 500);
  };

  const autoFocusRef = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    autoFocusRef.current[0]?.focus();
  }, []);

  const handleEnter = (index: number) => (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      autoFocusRef.current[index + 1]?.focus();
    }
  };

  return (
    <Card className="max-w-2xl mx-auto mt-10 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl">Patient Checkup Form</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {[
            { label: "Patient Name", name: "patient_name" },
            { label: "Patient Age", name: "patient_age" },
            { label: "Medical History", name: "patient_medical_history" },
            { label: "Symptoms", name: "symptoms" },
            { label: "Digonis", name: "digonis" },
            { label: "Prescript", name: "prescript" },
            { label: "Notes", name: "notes", textarea: true },
          ].map((field, index) => (
            <div key={field.name}>
              <Label>{field.label}</Label>
              {field.textarea ? (
                <Textarea
                  {...register(field.name as keyof CheckupFormData)}
                  onKeyDown={handleEnter(index)}
                  ref={(el) => {
                    // if (el) autoFocusRef.current[index] = el;
                  }}
                />
              ) : (
                <Input
                  {...register(field.name as keyof CheckupFormData)}
                  onKeyDown={handleEnter(index)}
                  ref={(el) => {
                    if (el) autoFocusRef.current[index] = el;
                  }}
                />
              )}
            </div>
          ))}

          <div>
            <Label>Gender</Label>
            <Select onValueChange={(value) => setValue("patient_gender", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-x-2 pt-4">
            {!recording && (
              <Button type="button" onClick={startRecording}>
                Start Recording
              </Button>
            )}
            {recording && !paused && (
              <Button type="button" onClick={pauseRecording}>
                Pause Recording
              </Button>
            )}
            {recording && paused && (
              <Button type="button" onClick={resumeRecording}>
                Resume Recording
              </Button>
            )}
            {recording && (
              <Button type="button" variant="destructive" onClick={stopRecording}>
                Stop Recording
              </Button>
            )}
          </div>

          <Button type="submit" className="mt-4 w-full">
            Submit Form
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CheckupForm;
