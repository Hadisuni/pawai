import { redirect } from 'next/navigation';

// The experience picker was removed from the first-time journey: there is
// exactly one live experience (the guided health conversation), so this step
// only added a choice screen with one choice. Old links land on /welcome,
// which flows straight into the conversation.
export default function ExperiencesPage() {
  redirect('/welcome');
}
