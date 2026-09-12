// Rule-based positive coaching engine. No AI API required for v1.
// Every function returns short, warm, honest, non-shaming microcopy.

export interface CoachingInput {
  leadsCount: number;
  overdueFollowups: number;
  followupsToday: number;
  big3Completed: number; // 0-3
  focusScore: number; // 0-10
  tasksMissed: number;
  hitMilestone: boolean;
  eveningReviewStreak: number;
  morningRoutineDoneToday: boolean;
}

export function generateCoachingMessages(input: CoachingInput): string[] {
  const messages: string[] = [];

  if (input.leadsCount === 0) {
    messages.push("Today's opportunity is simple: create one new conversation.");
  }

  if (input.overdueFollowups > 0) {
    messages.push('Revenue may already be sitting inside your follow-up list. Clear one today.');
  }

  if (input.followupsToday > 0 && input.overdueFollowups === 0) {
    messages.push(`You have ${input.followupsToday} follow-up${input.followupsToday > 1 ? 's' : ''} today. Each one is a door still open.`);
  }

  if (input.big3Completed === 3) {
    messages.push('You created real evidence today. This is how the vision gets built.');
  } else if (input.big3Completed === 0 && !input.morningRoutineDoneToday) {
    messages.push("One action can change today's score. Start with the smallest of your Big 3.");
  }

  if (input.focusScore > 0 && input.focusScore < 4) {
    messages.push("Don't solve the whole day. Complete the next 10-minute action.");
  }

  if (input.tasksMissed > 2) {
    messages.push("Let's reduce the task, not abandon the goal. Pick the one that matters most.");
  }

  if (input.hitMilestone) {
    messages.push('Pause and acknowledge this. What action created this result? Do it again.');
  }

  if (messages.length === 0) {
    messages.push("You're building momentum. Keep the next action small and specific.");
  }

  return messages;
}

export function resetMessage(): string {
  return "Let's reset. One action can change today's score.";
}

export function streakMessage(streak: number): string {
  if (streak === 0) return 'A fresh start is still a start. Begin today.';
  if (streak < 3) return `${streak}-day streak. You're building momentum.`;
  if (streak < 7) return `${streak} days strong. Consistency is compounding.`;
  return `${streak} days. This is who you are becoming.`;
}
