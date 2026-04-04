import { redirect } from 'next/navigation';

export default function LegacyClaimsPage() {
  redirect('/farmer/requests');
}
