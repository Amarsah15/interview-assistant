import { create } from "zustand";
import { persist } from "zustand/middleware";

const useStore = create(
  persist(
    (set, get) => ({
      // Candidate data
      candidates: {},
      currentCandidateId: null,

      // Current session data - ALL with default values
      candidateId: null,
      profile: null,
      questions: [], // Default empty array
      answers: [], // Default empty array
      score: null,
      summary: null,
      currentQuestionIndex: 0,
      timeLeft: 0, // persist current question timer
      interviewStarted: false,
      interviewCompleted: false,
      sessionPaused: false, // true when user left / refresh
      lastTab: "candidate", // persisted tab selection

      // Actions
      setCandidateId: (id) => set({ candidateId: id }),

      setProfile: (profile) => set({ profile }),

      setQuestions: (qs) =>
        set({
          questions: Array.isArray(qs) ? qs : [],
          currentQuestionIndex: 0,
        }),

      setCurrentQuestionIndex: (i) => set({ currentQuestionIndex: i }),

      setTimeLeft: (t) => set({ timeLeft: typeof t === "number" ? t : 0 }),

      addAnswer: (a) =>
        set((state) => ({
          answers: [...(state.answers || []), a],
          currentQuestionIndex: state.currentQuestionIndex + 1,
        })),

      setScore: (s) => set({ score: s }),

      setSummary: (summary) => set({ summary }),

      setInterviewStarted: (started) =>
        set({ interviewStarted: started, sessionPaused: false }),

      setInterviewCompleted: (completed) =>
        set({
          interviewCompleted: completed,
          sessionPaused: false,
        }),



      // pause/resume helpers
      pauseSession: () =>
        set((state) => ({
          sessionPaused: true,
          // interviewStarted stays as-is; we just mark paused
        })),

      resumeSession: () =>
        set({
          sessionPaused: false,
        }),

      setLastTab: (tab) => set({ lastTab: tab }),

      saveCandidate: () => {
        const state = get();
        if (!state.candidateId) return;

        set((prev) => ({
          candidates: {
            ...prev.candidates,
            [state.candidateId]: {
              id: state.candidateId,
              profile: state.profile,
              questions: state.questions || [],
              answers: state.answers || [],
              score: state.score,
              summary: state.summary,
              completed: state.interviewCompleted,
              timestamp: Date.now(),
            },
          },
        }));
      },

      resetInterview: () =>
        set({
          candidateId: null,
          profile: null,
          questions: [],
          answers: [],
          score: null,
          summary: null,
          currentQuestionIndex: 0,
          timeLeft: 0,
          interviewStarted: false,
          interviewCompleted: false,
          sessionPaused: false,
        }),

      pauseSessionNow: () =>
        set((state) => ({
          sessionPaused: true,
        })),

      // resumeSession used above
    }),
    {
      name: "interview-storage",
      partialize: (state) => ({
        candidates: state.candidates,
        candidateId: state.candidateId,
        profile: state.profile,
        questions: state.questions || [],
        answers: state.answers || [],
        score: state.score,
        summary: state.summary,
        currentQuestionIndex: state.currentQuestionIndex,
        timeLeft: state.timeLeft,
        interviewStarted: state.interviewStarted,
        interviewCompleted: state.interviewCompleted,
        sessionPaused: state.sessionPaused,
        lastTab: state.lastTab,
      }),
    }
  )
);

export default useStore;
