import { redirect } from 'next/navigation';

// QFine dipakai pribadi tanpa login: langsung ke dashboard
export default function HomePage() {
  redirect('/dashboard');
}
