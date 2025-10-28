"use client";


import React, { useMemo, useState } from "react";
import "@/styles/globals.css";
import { Pages } from "@/lib/pages";
import { buildDefaultAvatar } from "@/lib/avatar";
import { shareResult } from "@/lib/share";


import CtaPage from "@/components/pages/CtaPage";
import FormPage from "@/components/pages/FormPage";
import TimeEntryPage from "@/components/pages/TimeEntryPage";
import PhotoDecidePage from "@/components/pages/PhotoDecidePage";
import CameraPage from "@/components/pages/CameraPage";
import ManualCameraPage from "@/components/pages/ManualCameraPage";
import ReviewPage from "@/components/pages/ReviewPage";
import ThanksPage from "@/components/pages/ThanksPage";


export default function Page() {
  const [page, setPage] = useState(Pages.CTA);
  const [form, setForm] = useState({ name: "", email: "" });
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState("email"); // "email" | "phone"
  const [courseTime, setCourseTime] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [busy, setBusy] = useState(false);
  const [shareMessage, setShareMessage] = useState("");


  const canShare = useMemo(() => {
    const haveBasics = !!(form.name && courseTime && avatar);
    if (channel === "email") return haveBasics && !!form.email;
    return haveBasics && !!phone;
  }, [form, courseTime, avatar, phone, channel]);


  const handleSkipPhoto = () => {
    setAvatar(buildDefaultAvatar(form.name || "Runner"));
    setPage(Pages.REVIEW);
  };


  const handleCaptured = (faceUrl) => {
    setAvatar(faceUrl);
    setPage(Pages.REVIEW);
  };


  const share = async () => {
    setBusy(true);
    setShareMessage("");
    try {
      await shareResult({
        channel,
        to: channel === "email" ? form.email : phone,
        name: form.name,
        time: courseTime,
        avatar,
      });
      setPage(Pages.THANKS);
    } catch (e) {
      console.error(e);
      setShareMessage(e.message || "Couldn’t send.");
    } finally {
      setBusy(false);
    }
  };


  const restart = () => {
    setForm({ name: "", email: "" });
    setPhone("");
    setChannel("email");
    setCourseTime("");
    setAvatar(null);
    setShareMessage("");
    setPage(Pages.CTA);
  };

  return (
    <div className="kiosk-root">
      <div className="bg" />

      {page === Pages.CTA && <CtaPage onStart={() => setPage(Pages.FORM)} />}

      {page === Pages.FORM && (
        <FormPage
          form={form}
          setForm={setForm}
          channel={channel}
          setChannel={setChannel}
          phone={phone}
          setPhone={setPhone}
          onBack={() => setPage(Pages.CTA)}
          onNext={() => setPage(Pages.TIME)}
        />
      )}

      {page === Pages.TIME && (
        <TimeEntryPage
          value={courseTime}
          onChange={setCourseTime}
          onBack={() => setPage(Pages.FORM)}
          onNext={() => setPage(Pages.PHOTO_DECIDE)}
        />
      )}

      {page === Pages.PHOTO_DECIDE && (
        <PhotoDecidePage onSkip={handleSkipPhoto} onTake={() => setPage(Pages.MANUAL_CAMERA)} /> //Set Pages.CAMERA (for AI cam) or Pages.MANUAL_CAMERA (for standard)
      )}

      {page === Pages.CAMERA && (
        <CameraPage onBack={() => setPage(Pages.PHOTO_DECIDE)} onCaptured={handleCaptured} />
      )}
      {page === Pages.MANUAL_CAMERA && (
        <ManualCameraPage onBack={() => setPage(Pages.PHOTO_DECIDE)} onCaptured={handleCaptured} />
      )}

      {page === Pages.REVIEW && (
        <ReviewPage
          avatar={avatar}
          courseTime={courseTime}
          canShare={canShare}
          busy={busy}
          shareMessage={shareMessage}
          onShare={share}
          onRetake={() => setPage(Pages.MANUAL_CAMERA)} //Set Pages.CAMERA (for AI cam) or Pages.MANUAL_CAMERA (for standard)
          onChangeChoice={() => setPage(Pages.PHOTO_DECIDE)}
        />
      )}

      {page === Pages.THANKS && (
        <ThanksPage channel={channel} email={form.email} phone={phone} onRestart={restart} />
      )}
    </div>
  );
}