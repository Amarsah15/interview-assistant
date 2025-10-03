import { useMemo, useState, useEffect, useRef } from "react";
import api from "../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import useStore from "../store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, Send, User, Mail, Phone, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function MissingFieldsBot({ initialProfile = {}, onComplete }) {
  const { candidateId, setProfile } = useStore();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    name: initialProfile?.name || "",
    email: initialProfile?.email || "",
    phone: initialProfile?.phone || "",
  });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [finished, setFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef(null);

  const missingKeys = useMemo(() => {
    const arr = [];
    if (!answers.name || answers.name.length < 2)
      arr.push({
        key: "name",
        prompt: "What's your full name?",
        icon: User,
        placeholder: "Enter your full name",
      });
    if (!answers.email || !answers.email.includes("@"))
      arr.push({
        key: "email",
        prompt: "What's your email address?",
        icon: Mail,
        placeholder: "Enter your email address",
      });
    if (!answers.phone || answers.phone.length < 10)
      arr.push({
        key: "phone",
        prompt: "What's your phone number?",
        icon: Phone,
        placeholder: "Enter 10-digit phone number",
      });
    return arr;
  }, [answers]);

  useEffect(() => {
    if (messages.length === 0 && missingKeys.length > 0) {
      setTimeout(() => {
        setMessages([
          {
            from: "bot",
            text: `Hi! 👋 I need to collect some information to complete your profile. ${missingKeys[0].prompt}`,
          },
        ]);
      }, 300);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  function validateInput(key, value) {
    if (key === "email") {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }
    if (key === "phone") {
      const digits = value.replace(/[\s-]/g, "");
      return /^[6-9]\d{9}$/.test(digits);
    }
    if (key === "name") {
      return value.trim().length >= 2;
    }
    return value.trim().length > 0;
  }

  async function sendMessage() {
    if (!input.trim() || isSubmitting) return;

    const key = missingKeys[step].key;

    if (!validateInput(key, input.trim())) {
      setMessages((prev) => [
        ...prev,
        { from: "user", text: input.trim() },
        {
          from: "bot",
          text: `❌ Please enter a valid ${key}. ${
            key === "email"
              ? "Example: user@example.com"
              : key === "phone"
              ? "Example: 9876543210"
              : "At least 2 characters required"
          }`,
          error: true,
        },
      ]);
      setInput("");
      toast.error(`Invalid ${key} format`);
      return;
    }

    const updated = { ...answers, [key]: input.trim() };
    setAnswers(updated);

    setMessages((prev) => [...prev, { from: "user", text: input.trim() }]);
    setInput("");

    if (step + 1 < missingKeys.length) {
      setStep(step + 1);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { from: "bot", text: `✅ Got it! ${missingKeys[step + 1].prompt}` },
        ]);
      }, 500);
      toast.success(`${key} saved!`);
    } else {
      setIsSubmitting(true);
      toast.loading("Saving your profile...");

      try {
        await api.post("/api/complete-profile", {
          candidateId,
          profile: updated,
        });

        toast.dismiss();
        setProfile(updated);
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: "🎉 Perfect! Your profile is complete. You're all set to start the interview!",
          },
        ]);
        setFinished(true);
        toast.success("Profile completed successfully!");

        if (onComplete) {
          setTimeout(() => onComplete(updated), 1000);
        }
      } catch (e) {
        toast.dismiss();
        console.error("Profile save error:", e);
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: "❌ Error saving profile. Please try again.",
            error: true,
          },
        ]);
        toast.error("Failed to save profile");
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  const progress = (step / missingKeys.length) * 100;

  if (finished || missingKeys.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-green-900/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="flex-shrink-0"
              >
                <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-white" />
                </div>
              </motion.div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-100 mb-2">
                  Profile Complete! 🎉
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-semibold">{answers.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-semibold">{answers.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-semibold">{answers.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const CurrentIcon = missingKeys[step]?.icon || User;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-2 border-purple-200 dark:border-purple-800">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <CurrentIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Complete Your Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Step {step + 1} of {missingKeys.length}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-right text-muted-foreground">
              {Math.round(progress)}%
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-[300px] p-4">
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 ${
                      m.from === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <Avatar className="h-8 w-8 border-2">
                      <AvatarFallback
                        className={`text-xs font-semibold ${
                          m.from === "user"
                            ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white"
                            : "bg-gradient-to-br from-green-500 to-emerald-500 text-white"
                        }`}
                      >
                        {m.from === "user" ? "U" : "AI"}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`rounded-2xl px-4 py-3 max-w-[80%] shadow-sm ${
                        m.from === "user"
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                          : m.error
                          ? "bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-800"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{m.text}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-muted/30">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <CurrentIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    missingKeys[step]?.placeholder ||
                    `Enter your ${missingKeys[step]?.key}...`
                  }
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  disabled={isSubmitting}
                  className="pl-10 border-2 focus:border-purple-500 dark:focus:border-purple-400"
                />
              </div>
              <Button
                onClick={sendMessage}
                size="icon"
                disabled={!input.trim() || isSubmitting}
                className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              💡 Press Enter to submit
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
