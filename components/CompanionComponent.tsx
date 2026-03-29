"use client";
//imports
import { cn, configureAssistant, getSubjectColor } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { error } from "console";
import React, { use, useEffect, useRef, useState } from "react";
import { set } from "zod";
import Image from "next/image";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import soundwaves from "@/constants/soundwaves.json";
import {
  addToSessionHistory,
  newSessionPermissions,
} from "@/lib/actions/companion.actions";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
//interfaces
enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

const CompanionComponent = ({
  companionId,
  subject,
  topic,
  name,
  userName,
  userImage,
  style,
  voice,
}: CompanionComponentProps) => {
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  //lottie animation
  useEffect(() => {
    if (lottieRef) {
      if (isSpeaking) {
        lottieRef.current?.play();
      } else {
        lottieRef.current?.stop();
      }
    }
  }, [isSpeaking, lottieRef]);

  useEffect(() => {
    const onCallStart = () => setCallStatus(CallStatus.ACTIVE);

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);

      addToSessionHistory(companionId);
    };

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [newMessage, ...prev]);
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);

    const onError = (error: Error) => console.log("Error: ", error);

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  const toggleMicrophone = () => {
    const isMuted = vapi.isMuted();
    vapi.setMuted(!isMuted);
    setIsMuted(!isMuted);
  };

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    const assistantOverrides = {
      variableValues: {
        subject,
        topic,
        style,
      },
      clientMessages: ["transcript"] as any,
      serverMessages: [] as any,
    };

    vapi.start(configureAssistant(voice, style), assistantOverrides);
  };

  const handleDisconnect = async () => {
    setCallStatus(CallStatus.FINISHED);

    vapi.stop();
  };

  return (
    <section className="flex gap-6 h-[calc(88vh-120px)]  max-sm:flex-col">
      <div className="transcript w-1/4 max-sm:w-full max-sm:order-2 border rounded-lg p-4 bg-white flex flex-col h-full overflow-hidden">
        <div className="transcript-message flex-1 overflow-y-auto">
          {messages.map((message, index) => {
            if (message.role == "assistant") {
              return (
                <p key={index} className="max-sm:text-sm">
                  {name.split(" ")[0].replace("/[,.]/g", "")}: {message.content}
                </p>
              );
            } else {
              return (
                <p key={index} className="text-primary max-sm:text-sm">
                  {userName}: {message.content}
                </p>
              );
            }
          })}
        </div>
        <div className="transcript-fade" />
      </div>

      <div className="w-1/2 max-sm:w-full max-sm:order-1 companion-section  flex flex-col items-center justify-center">
        <div
          className="companion-avatar"
          style={{ backgroundColor: getSubjectColor(subject) }}
        >
          <div
            className={cn(
              "absolute transition-opacity duration-1000",
              callStatus === CallStatus.FINISHED ||
                callStatus === CallStatus.INACTIVE
                ? "opacity-100"
                : "opacity-0",
              callStatus === CallStatus.CONNECTING &&
                "opacity-100 animate-pulse",
            )}
          >
            <Image
              src={`/icons/${subject}.svg`}
              alt="subject"
              width={150}
              height={150}
              className="max-sm:w-fit"
            />
          </div>

          <div
            className={cn(
              "absolute transition-opacity duration-1000 ",
              callStatus === CallStatus.ACTIVE ? "opacity-100" : "opacity-0",
            )}
          >
            <Lottie
              lottieRef={lottieRef}
              animationData={soundwaves}
              autoPlay={false}
              className="companion-lottie"
            ></Lottie>
          </div>
        </div>

        <p className="font-bold text-2xl">{name}</p>
      </div>

      <div className="w-1/4 max-sm:w-full max-sm:order-3 user-section flex flex-col justify-between max-sm:flex-row">
        <div className="user-avatar">
          <Image
            src={userImage}
            alt="userName"
            width={130}
            height={130}
            className="rounded-lg"
          ></Image>
          <p className="font-bold text-2xl">{userName}</p>
        </div>
        <button
          className="btn-mic"
          onClick={toggleMicrophone}
          disabled={callStatus !== CallStatus.ACTIVE}
        >
          <Image
            src={isMuted ? `/icons/mic-off.svg` : `/icons/mic-on.svg`}
            alt="mic"
            width={36}
            height={36}
          />
          <p className="max-sm:hidden">
            {isMuted ? "Turn On Microphone" : "Turn Off Microphone"}
          </p>
        </button>
        <button
          className={cn(
            "rounded-lg py-2 cursor-pointer transition-colors w-full text-white ",
            callStatus === CallStatus.ACTIVE ? `bg-red-700` : "bg-primary",
            callStatus === CallStatus.CONNECTING && "animate-pulse",
          )}
          onClick={
            callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall
          }
        >
          {callStatus === CallStatus.ACTIVE
            ? "End Session"
            : callStatus === CallStatus.CONNECTING
              ? "Connecting"
              : "Start Session"}
        </button>
      </div>
    </section>
  );
};

export default CompanionComponent;
