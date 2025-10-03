import { useState } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import {
  UploadCloud,
  FileText,
  Loader2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import useStore from "../store/useStore";
import MissingFieldsBot from "./MissingFieldsBot";

export default function ResumeUpload({ onProfileComplete }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parsedInfo, setParsedInfo] = useState(null);
  const { setProfile, setCandidateId, profile } = useStore();

  async function handleUpload(e) {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a file");
      return;
    }

    const validExtensions = [".pdf", ".docx"];
    const fileExtension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      toast.error("Please upload a PDF or DOCX file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setLoading(true);
      toast.loading("Parsing your resume with AI...");

      const res = await api.post("/api/parse-resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.dismiss();

      if (res.data) {
        const cleanedData = {
          name: res.data.name?.trim() || "",
          email: res.data.email?.trim() || "",
          phone: res.data.phone?.replace(/\n/g, "").trim() || "",
        };

        setCandidateId(Date.now().toString());
        setParsedInfo(cleanedData);

        if (cleanedData.name && cleanedData.email && cleanedData.phone) {
          setProfile(cleanedData);
          toast.success("Resume parsed successfully! All fields extracted.");
          if (onProfileComplete) {
            onProfileComplete(cleanedData);
          }
        } else {
          toast.info("Resume uploaded! Please complete missing fields.");
        }
      } else {
        toast.error("Could not parse resume. Please try again.");
      }
    } catch (err) {
      toast.dismiss();
      console.error(err);

      if (err.response) {
        toast.error(err.response.data.message || "Server error");
      } else if (err.request) {
        toast.error("Cannot connect to server. Is it running on port 5000?");
      } else {
        toast.error("Upload failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (profile) {
    return null;
  }

  return (
    <div className="space-y-6">
      <motion.div
        className="max-w-xl mx-auto p-8 text-center space-y-6 bg-card border rounded-2xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-3">
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <UploadCloud className="mx-auto h-16 w-16 text-primary" />
          </motion.div>

          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text">
            Upload Your Resume
          </h2>
          <p className="text-sm text-muted-foreground">
            AI-powered parsing • Supported formats: PDF or DOCX
          </p>
        </div>

        <motion.label
          htmlFor="resume-input"
          className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 hover:border-primary transition-all duration-300 hover:bg-accent/50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <AnimatePresence mode="wait">
            {file ? (
              <motion.div
                key="file-selected"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center gap-3"
              >
                <CheckCircle2 className="h-10 w-10 text-green-500" />
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-5 w-5 text-primary" />
                  {file.name}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="no-file"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground block">
                  Click to select or drag & drop your resume
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <input
            id="resume-input"
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) {
                setFile(selectedFile);
                setParsedInfo(null);
                toast.success(`${selectedFile.name} selected`);
              }
            }}
          />
        </motion.label>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleUpload}
            disabled={loading || !file}
            className="w-full h-12 text-base font-semibold cursor-pointer bg-primary"
            size="lg"
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Parsing Resume...
                </motion.div>
              ) : (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 "
                >
                  <UploadCloud className="h-5 w-5 " />
                  Upload & Parse Resume
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>

        {file && !loading && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => {
              setFile(null);
              setParsedInfo(null);
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear selection
          </motion.button>
        )}
      </motion.div>

      {/* Missing Fields Bot with Animation */}
      <AnimatePresence>
        {parsedInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <MissingFieldsBot
              initialProfile={parsedInfo}
              onComplete={(completedProfile) => {
                setProfile(completedProfile);
                if (onProfileComplete) {
                  onProfileComplete(completedProfile);
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
