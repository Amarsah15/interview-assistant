import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function WelcomeBackModal({ onResume, onRestart }) {
  return (
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome Back! 👋</DialogTitle>
          <p className="text-sm text-muted-foreground">
            You have an interview in progress. Do you want to continue where you
            left off or start over?
          </p>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onRestart}>
            Start Over
          </Button>
          <Button onClick={onResume}>Continue Interview</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
