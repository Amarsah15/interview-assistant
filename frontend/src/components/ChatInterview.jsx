import { useState, useEffect, useRef } from "react";
import api from "../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import useStore from "../store/useStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Clock,
  Send,
  Loader2,
  Trophy,
  Home,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ChatInterview() {
  const {
    candidateId,
    questions = [],
    setQuestions,
    addAnswer,
    currentQuestionIndex = 0,
    setCurrentQuestionIndex,
    score,
    setScore,
    setSummary,
    setInterviewStarted,
    setInterviewCompleted,
    saveCandidate,
    profile,
    resetInterview,
  } = useStore();

  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [localTimeLeft, setLocalTimeLeft] = useState(0);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const timerRef = useRef(null);
  const isSubmittingRef = useRef(isSubmitting);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  const currentQuestion =
    questions && questions.length > 0 ? questions[currentQuestionIndex] : null;

  // Initialize timer when question changes
  useEffect(() => {
    if (currentQuestion) {
      setLocalTimeLeft(currentQuestion.time);
      setAnswer("");
    }
  }, [currentQuestionIndex, currentQuestion]);

  // Timer countdown
  useEffect(() => {
    if (currentQuestion && localTimeLeft > 0 && !showResults) {
      timerRef.current = setInterval(() => {
        setLocalTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            if (!isSubmittingRef.current) {
              handleAutoSubmit();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [localTimeLeft, currentQuestion, showResults]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  async function startInterview() {
    if (!candidateId || !profile) {
      toast.error("Please complete your profile first!");
      return;
    }

    setLoading(true);
    toast.loading("Generating interview questions...");

    try {
      const res = await api.post("/api/generate-questions", {
        candidateId,
        role: "fullstack developer",
      });

      toast.dismiss();

      if (res.data && res.data.questions && Array.isArray(res.data.questions)) {
        setQuestions(res.data.questions);
        setInterviewStarted(true);
        toast.success(
          `${res.data.questions.length} questions ready! Good luck! 🚀`
        );
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (e) {
      toast.dismiss();
      console.error(e);
      toast.error("Failed to start interview. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAutoSubmit() {
    toast.warning("⏰ Time's up! Auto-submitting...");
    await submitAnswer(true);
  }

  async function submitAnswer(isAuto = false) {
    if (isSubmitting || !currentQuestion) return;

    setIsSubmitting(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const q = currentQuestion;
    const finalAnswer = answer.trim() || (isAuto ? "(No answer provided)" : "");

    // Check if this is the last question BEFORE submitting
    const isLastQuestion = currentQuestionIndex + 1 >= questions.length;

    try {
      await api.post("/api/save-answer", {
        candidateId,
        questionId: q.id,
        answer: finalAnswer,
      });

      addAnswer({ questionId: q.id, answer: finalAnswer });

      if (isLastQuestion) {
        // Show calculating state immediately
        setShowResults(true);
        setScore(null); // This will show loading state
        toast.loading("📊 Calculating your final score...");

        const res = await api.post("/api/score", {
          candidateId,
        });

        toast.dismiss();
        setScore(res.data.score);
        setSummary(res.data.summary || "Interview completed successfully");
        setInterviewCompleted(true);
        saveCandidate();

        toast.success(`🎉 Interview completed! Score: ${res.data.score}%`);
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setAnswer("");
        setIsSubmitting(false);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit answer. Please try again.");
      setIsSubmitting(false);
      setShowResults(false);
    }
  }

  async function handleExitInterview() {
    setShowExitDialog(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    toast.loading("Saving your progress...");

    try {
      const answeredCount = currentQuestionIndex;

      if (answeredCount > 0) {
        const res = await api.post("/api/score", {
          candidateId,
        });

        toast.dismiss();
        setScore(res.data.score);
        setSummary(
          `Interview ended early. Answered ${answeredCount} of ${questions.length} questions.`
        );
        setInterviewCompleted(true);
        saveCandidate();
        setShowResults(true);

        toast.success(`Progress saved! ${answeredCount} questions answered.`);
      } else {
        toast.dismiss();
        resetInterview();
        toast.info("Interview cancelled. No answers submitted.");
      }
    } catch (e) {
      toast.dismiss();
      console.error(e);
      toast.error("Failed to save progress. Please try again.");
    }
  }

  function handleExit() {
    resetInterview();
    toast.success("Ready for a new interview!");
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  // Calculating Screen - shown when showResults is true but score is null
  if (showResults && score === null) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <Card className="shadow-2xl border-2">
            <CardContent className="p-16 text-center space-y-8">
              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <Loader2 className="h-24 w-24 mx-auto text-primary" />
              </motion.div>

              <div>
                <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text">
                  Calculating Your Score
                </h3>
                <p className="text-lg text-muted-foreground">
                  Please wait while we analyze your responses...
                </p>
              </div>

              <div className="flex justify-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  className="h-3 w-3 bg-primary rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  className="h-3 w-3 bg-primary rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  className="h-3 w-3 bg-primary rounded-full"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Results Screen - shown when score is available
  if (showResults && score !== null) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <Card className="overflow-hidden shadow-2xl border-2">
            <div className="text-center border-b bg-gradient-to-br from-primary/5 via-primary/10 to-background p-12">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 1 }}
                className="inline-block mb-6"
              >
                <div className="p-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-xl">
                  <Trophy className="h-20 w-20 text-white" />
                </div>
              </motion.div>

              <h2 className="text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text">
                Interview Complete!
              </h2>
              <p className="text-lg text-muted-foreground">
                Thank you for your time, {profile?.name}
              </p>
            </div>
            <CardContent className="p-10 space-y-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-48 h-48 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border-4 border-primary mb-6 shadow-xl">
                  <span className="text-6xl font-bold text-primary">
                    {score}%
                  </span>
                </div>

                <p className="text-2xl font-bold">
                  {score >= 80
                    ? "🌟 Outstanding!"
                    : score >= 60
                    ? "👍 Well Done!"
                    : score >= 40
                    ? "💪 Good Effort!"
                    : "📚 Keep Learning!"}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 gap-6"
              >
                <div className="text-center p-8 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl border-2 border-primary/20">
                  <p className="text-4xl font-bold mb-2">{questions.length}</p>
                  <p className="text-sm text-muted-foreground font-medium">
                    Total Questions
                  </p>
                </div>
                <div className="text-center p-8 bg-gradient-to-br from-green-500/10 to-transparent rounded-2xl border-2 border-green-500/20">
                  <p className="text-4xl font-bold mb-2">
                    {Math.round((score / 100) * questions.length)}
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">
                    Correct Answers
                  </p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="p-6 bg-muted/50 rounded-2xl space-y-4"
              >
                <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">
                  Interview Summary
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Candidate</p>
                    <p className="font-semibold">{profile?.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-semibold">{profile?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-semibold">{profile?.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-semibold">
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <Button
                  onClick={handleExit}
                  className="w-full h-14 text-lg"
                  size="lg"
                >
                  <Home className="mr-2 h-6 w-6" />
                  Start New Interview
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-2xl"
        >
          <Card className="shadow-2xl border-2">
            <CardContent className="p-16 text-center space-y-8">
              <motion.div
                animate={{
                  y: [0, -15, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Sparkles className="h-24 w-24 mx-auto text-primary mb-6" />
              </motion.div>

              <div>
                <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text">
                  Ready to Start?
                </h3>
                <p className="text-lg text-muted-foreground">
                  Your AI-powered interview is ready to begin
                </p>
              </div>

              <Button
                onClick={startInterview}
                disabled={loading}
                size="lg"
                className="h-16 px-12 text-lg shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>Start Interview</>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-6 relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-4xl"
      >
        <Card className="overflow-hidden shadow-2xl border-2 border-purple-200 dark:border-purple-800 relative">
          <div className="bg-purple-500 text-white p-5">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shadow-lg border-2 border-white/30">
                  <span className="text-xl font-bold text-white">
                    {currentQuestionIndex + 1}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-xl">
                    Question {currentQuestionIndex + 1}
                  </h3>
                  <p className="text-sm text-white/80">
                    of {questions.length} questions
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {currentQuestion && (
                  <motion.div
                    key={`timer-${currentQuestionIndex}`}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className={`flex flex-col items-center gap-1 px-6 py-3 rounded-xl border-2 shadow-lg ${
                      localTimeLeft <= 10
                        ? "bg-red-500 border-red-300"
                        : "bg-white/20 backdrop-blur border-white/30"
                    }`}
                  >
                    <Clock
                      className={`h-5 w-5 ${
                        localTimeLeft <= 10 ? "animate-pulse" : ""
                      } text-white`}
                    />
                    <span className="font-mono font-bold text-3xl text-white">
                      {formatTime(localTimeLeft)}
                    </span>
                    <span className="text-xs font-medium text-white/90">
                      TIME LEFT
                    </span>
                  </motion.div>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowExitDialog(true)}
                  className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900"
                  title="Exit Interview"
                >
                  <XCircle className="h-5 w-5 text-red-500" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold text-white">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-yellow-300 to-green-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              {currentQuestion && (
                <div className="flex gap-2 mt-2">
                  <Badge className="capitalize px-3 py-1 text-xs bg-white/20 border-white/30 text-white hover:bg-white/30">
                    📊 {currentQuestion.difficulty}
                  </Badge>
                  <Badge className="px-3 py-1 text-xs bg-white/20 border-white/30 text-white hover:bg-white/30">
                    {currentQuestion.type === "mcq"
                      ? "🔘 Multiple Choice"
                      : "✍️ Descriptive"}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <CardContent className="p-8">
            {currentQuestion && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 p-8 rounded-2xl border-2 border-purple-200 dark:border-purple-700 shadow-lg">
                    <div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase tracking-widest mb-3">
                        Interview Question
                      </p>

                      <h2 className="text-2xl font-bold leading-relaxed text-gray-800 dark:text-gray-100">
                        {currentQuestion.text}
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {currentQuestion.type === "subjective" ? (
                      <>
                        <label className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Your Answer
                        </label>
                        <Textarea
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          placeholder="Type your detailed answer here..."
                          className="min-h-[140px] resize-none text-base rounded-xl border-2 border-purple-200 dark:border-purple-700 p-5 focus:border-purple-500 dark:focus:border-purple-400"
                          disabled={isSubmitting}
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              e.ctrlKey &&
                              answer.trim()
                            ) {
                              submitAnswer();
                            }
                          }}
                        />
                        <div className="flex justify-between items-center">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              💡 <strong>Tip:</strong> Press Ctrl+Enter to
                              submit
                            </p>
                          </div>
                          <Button
                            onClick={() => submitAnswer()}
                            disabled={isSubmitting || !answer.trim()}
                            size="lg"
                            className="px-8 h-12 text-base bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <Send className="mr-2 h-5 w-5" />
                                Submit Answer
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <label className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Select Your Answer
                        </label>
                        <div className="space-y-3">
                          {currentQuestion.options?.map((opt, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -30 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.08 }}
                            >
                              <Button
                                variant={answer === opt ? "default" : "outline"}
                                size="lg"
                                className={`w-full justify-start text-left h-auto py-5 px-6 text-base rounded-xl transition-all ${
                                  answer === opt
                                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl ring-4 ring-green-200 dark:ring-green-800 scale-[1.02]"
                                    : "border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:shadow-md hover:scale-[1.01]"
                                }`}
                                onClick={() => setAnswer(opt)}
                                disabled={isSubmitting}
                              >
                                <div className="flex items-center gap-4 w-full">
                                  <div
                                    className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-md ${
                                      answer === opt
                                        ? "bg-white text-green-600"
                                        : "bg-gradient-to-br from-blue-500 to-purple-500 text-white"
                                    }`}
                                  >
                                    {String.fromCharCode(65 + i)}
                                  </div>
                                  <span className="flex-1">{opt}</span>
                                  {answer === opt && (
                                    <CheckCircle2 className="h-6 w-6 text-white" />
                                  )}
                                </div>
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                        <Button
                          onClick={() => submitAnswer()}
                          disabled={isSubmitting || !answer}
                          className="w-full h-14 text-base rounded-xl shadow-xl mt-5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600"
                          size="lg"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                              Submitting Answer...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-5 w-5" />
                              {currentQuestionIndex + 1 === questions.length
                                ? "Submit Final Answer"
                                : "Submit & Continue"}
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </CardContent>
        </Card>

        <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <XCircle className="h-6 w-6 text-orange-500" />
                Exit Interview?
              </DialogTitle>
              <DialogDescription className="text-base pt-2">
                Are you sure you want to exit this interview?
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  ✅ Your Progress Will Be Saved
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Questions answered: {currentQuestionIndex} of{" "}
                  {questions.length}
                </p>
              </div>

              {currentQuestionIndex === 0 && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <p className="text-sm text-orange-900 dark:text-orange-100">
                    ⚠️ You haven't answered any questions yet. Your progress
                    will not be saved.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => setShowExitDialog(false)}
              >
                Continue Interview
              </Button>
              <Button variant="destructive" onClick={handleExitInterview}>
                <XCircle className="h-4 w-4 mr-2" />
                Exit & Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
