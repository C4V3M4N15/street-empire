
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button'; // For consistency if needed

interface GameOverDialogProps {
  isOpen: boolean;
  onClose: () => void; // Typically a reset function
  daysPassed: number;
  finalCash: number;
  rank: string;
}

export function GameOverDialog({ isOpen, onClose, daysPassed, finalCash, rank }: GameOverDialogProps) {
  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="bg-card text-card-foreground border-destructive">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl text-destructive-foreground flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-7 w-7"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
            Game Over!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground pt-2">
            Your reign has come to an end. Here's how you fared:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4 space-y-2 text-sm">
            <p><strong>Days Survived:</strong> {daysPassed}</p>
            <p><strong>Final Cash:</strong> ${finalCash.toLocaleString()}</p>
            <p><strong>Final Rank:</strong> {rank}</p>
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
            Try Again
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
