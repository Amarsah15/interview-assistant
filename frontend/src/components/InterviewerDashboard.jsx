import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import useStore from "../store/useStore";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Eye,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function InterviewerDashboard() {
  const { candidates } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("score");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Add this

  const candidateList = useMemo(() => {
    return Object.values(candidates || {}).filter((c) => c.completed);
  }, [candidates, refreshKey]); // Add refreshKey dependency

  const filteredCandidates = useMemo(() => {
    let filtered = candidateList.filter(
      (c) =>
        c.profile?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      if (sortBy === "score") return (b.score || 0) - (a.score || 0);
      if (sortBy === "date") return b.timestamp - a.timestamp;
      return 0;
    });

    return filtered;
  }, [candidateList, searchQuery, sortBy]);

  function getScoreBadge(score) {
    if (score >= 80)
      return (
        <Badge className="bg-green-500 hover:bg-green-600">Excellent</Badge>
      );
    if (score >= 60)
      return <Badge className="bg-blue-500 hover:bg-blue-600">Good</Badge>;
    if (score >= 40)
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600">Average</Badge>
      );
    return <Badge variant="destructive">Poor</Badge>;
  }

  // Refresh handler - stays on same tab
  function handleRefresh() {
    setRefreshKey((prev) => prev + 1);
    toast.success("Dashboard refreshed successfully!");
  }

  const avgScore =
    candidateList.length > 0
      ? Math.round(
          candidateList.reduce((sum, c) => sum + c.score, 0) /
            candidateList.length
        )
      : 0;

  const passedCount = candidateList.filter((c) => c.score >= 60).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Candidates
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {candidateList.length}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Passed (≥60%)
                  </p>
                  <p className="text-3xl font-bold mt-2">{passedCount}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Award className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Average Score
                  </p>
                  <p className="text-3xl font-bold mt-2">{avgScore}%</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Table Card */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-background via-primary/5 to-background">
          <div className="space-y-4">
            <div className="flex justify-between items-center mt-6">
              <div>
                <h2 className="text-2xl font-bold">Candidate Dashboard</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage and review all completed interviews
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Search and Sort */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-lg"
                />
              </div>
              <Button
                variant={sortBy === "score" ? "default" : "outline"}
                onClick={() => setSortBy("score")}
                className="rounded-lg"
              >
                Sort by Score
              </Button>
              <Button
                variant={sortBy === "date" ? "default" : "outline"}
                onClick={() => setSortBy("date")}
                className="rounded-lg"
              >
                Sort by Date
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredCandidates.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-20" />
              <p className="text-lg text-muted-foreground mb-2">
                {candidateList.length === 0
                  ? "No completed interviews yet"
                  : "No candidates match your search"}
              </p>
              {candidateList.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Completed interviews will appear here
                </p>
              )}
            </motion.div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredCandidates.map((candidate, idx) => (
                      <motion.tr
                        key={candidate.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {candidate.profile?.name || "N/A"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {candidate.profile?.email || "N/A"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {candidate.profile?.phone || "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">
                              {candidate.score || 0}%
                            </span>
                            {candidate.score >= 60 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getScoreBadge(candidate.score || 0)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(candidate.timestamp).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedCandidate(candidate)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Candidate Details Dialog */}
      <AnimatePresence>
        {selectedCandidate && (
          <Dialog
            open={!!selectedCandidate}
            onOpenChange={() => setSelectedCandidate(null)}
          >
            <DialogContent className="max-w-4xl max-h-[85vh]">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  Interview Details - {selectedCandidate.profile?.name}
                </DialogTitle>
              </DialogHeader>

              <ScrollArea className="h-[70vh] pr-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 p-1"
                >
                  {/* Profile Card */}
                  <Card className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-background pb-3">
                      <h3 className="mt-3 font-semibold flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5" />
                        Profile Information
                      </h3>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Grid Layout for Profile Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                            Full Name
                          </p>
                          <p className="font-semibold text-base break-words">
                            {selectedCandidate.profile?.name}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                            Email Address
                          </p>
                          <p className="font-medium text-sm break-all text-blue-600 dark:text-blue-400">
                            {selectedCandidate.profile?.email}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                            Phone Number
                          </p>
                          <p className="font-semibold text-base">
                            {selectedCandidate.profile?.phone}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                            Interview Date & Time
                          </p>
                          <p className="font-medium text-sm">
                            {new Date(
                              selectedCandidate.timestamp
                            ).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Questions Card */}
                  <Card>
                    <CardHeader>
                      <h3 className="font-semibold flex items-center gap-2 mt-3">
                        <Award className="h-5 w-5" />
                        Questions & Answers (
                        {selectedCandidate.questions?.length || 0})
                      </h3>
                    </CardHeader>
                    <CardContent className="space-y-4 mb-3">
                      {selectedCandidate.questions?.map((q, idx) => {
                        const ans = selectedCandidate.answers?.find(
                          (a) => a.questionId === q.id
                        );
                        const isCorrect =
                          q.type === "mcq" && ans?.answer === q.answer;

                        return (
                          <div
                            key={q.id}
                            className={`p-4 rounded-lg border-l-4 ${
                              isCorrect
                                ? "border-green-500 bg-green-50 dark:bg-green-900/10"
                                : "border-primary bg-muted/50"
                            }`}
                          >
                            <div className="flex gap-2 mb-3">
                              <Badge variant="outline" className="capitalize">
                                {q.difficulty}
                              </Badge>
                              <Badge variant="outline">{q.type}</Badge>
                            </div>
                            <p className="font-semibold mb-2">
                              Q{idx + 1}: {q.text}
                            </p>

                            {q.type === "mcq" && (
                              <p className="text-sm text-muted-foreground mb-2">
                                <strong>Correct:</strong> {q.answer}
                              </p>
                            )}

                            <p className="text-sm">
                              <strong>Answer:</strong>{" "}
                              <span
                                className={
                                  isCorrect
                                    ? "text-green-600 font-semibold"
                                    : ""
                                }
                              >
                                {ans?.answer || "No answer"}
                              </span>
                            </p>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </motion.div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
