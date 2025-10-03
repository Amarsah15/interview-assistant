import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ResumeUpload from "./components/ResumeUpload";
import ChatInterview from "./components/ChatInterview";
import InterviewerDashboard from "./components/InterviewerDashboard";
import WelcomeBackModal from "./components/WelcomeBackModal";
import useStore from "./store/useStore";
import { Button } from "./components/ui/button";
import {
  AlertCircle,
  Sparkles,
  CheckCircle2,
  User,
  Mail,
  Phone,
} from "lucide-react";
import { Toaster } from "sonner";
import ThemeToggle from "./components/ui/ThemeToggle";
import AppToaster from "./components/ui/Toaster";

export default function App() {
  const {
    candidateId,
    profile,
    interviewStarted,
    interviewCompleted,
    questions,
    resetInterview,
    resumeSession,
    sessionPaused,
    pauseSession,
  } = useStore();

  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [tab, setTab] = useState("candidate");

  const interviewInProgress =
    interviewStarted && !interviewCompleted && (questions?.length ?? 0) > 0;

  useEffect(() => {
    if (
      candidateId &&
      profile &&
      interviewStarted &&
      !interviewCompleted &&
      sessionPaused
    ) {
      setShowWelcomeBack(true);
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (interviewInProgress) {
        pauseSession();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [interviewInProgress, pauseSession]);

  function handleResume() {
    resumeSession();
    setShowWelcomeBack(false);
  }

  function handleRestart() {
    resetInterview();
    setShowWelcomeBack(false);
  }

  function handleTabChange(newTab) {
    if (interviewInProgress && newTab === "interviewer") {
      if (!confirm("Leave interview? Progress will be saved.")) {
        return;
      }
    }

    if (newTab === "candidate" && interviewCompleted) {
      resetInterview();
    }

    setTab(newTab);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Toaster position="top-right" richColors closeButton />

      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text">
                  Interview Assistant
                </h1>
                <p className="text-xs text-muted-foreground">
                  Powered by AI <span className="font-bold">|</span> Smart
                  Recruitment
                </p>
              </div>
              <ThemeToggle />
            </motion.div>

            {candidateId &&
              tab === "candidate" &&
              !interviewCompleted &&
              profile && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Button
                    variant="outline"
                    onClick={handleRestart}
                    className="rounded-lg"
                  >
                    Start New
                  </Button>
                </motion.div>
              )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 rounded-xl">
            <TabsTrigger value="candidate" className="rounded-lg">
              Interview
            </TabsTrigger>
            <TabsTrigger
              value="interviewer"
              disabled={interviewInProgress}
              className="rounded-lg"
            >
              Dashboard
            </TabsTrigger>
          </TabsList>

          {interviewInProgress && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Interview in progress. Complete or exit to access the dashboard.
              </p>
            </motion.div>
          )}

          <TabsContent value="candidate" className="space-y-6">
            {!profile ? (
              <ResumeUpload />
            ) : (
              <>
                {/* Enhanced Profile Complete Card */}
                {!interviewCompleted && !interviewInProgress && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-2xl mx-auto mb-6"
                  >
                    <Card className="overflow-hidden border-green-200 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-green-900/20">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Avatar/Icon */}
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

                          {/* Profile Info */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-green-800 dark:text-green-100">
                                Profile Complete
                              </h3>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                <User className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                  <span className="text-muted-foreground font-medium">
                                    Name:
                                  </span>
                                  <span className="font-semibold text-foreground">
                                    {profile.name}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <Mail className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                  <span className="text-muted-foreground font-medium">
                                    Email:
                                  </span>
                                  <span className="font-semibold text-foreground">
                                    {profile.email}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <Phone className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                  <span className="text-muted-foreground font-medium">
                                    Phone:
                                  </span>
                                  <span className="font-semibold text-foreground">
                                    {profile.phone}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex-shrink-0"
                          >
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700"
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              Ready
                            </Badge>
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
                <ChatInterview />
              </>
            )}
          </TabsContent>

          <TabsContent value="interviewer">
            <InterviewerDashboard />
          </TabsContent>
        </Tabs>
      </main>

      {showWelcomeBack && (
        <WelcomeBackModal
          open={showWelcomeBack}
          onResume={handleResume}
          onRestart={handleRestart}
        />
      )}
      <AppToaster />
    </div>
  );
}
