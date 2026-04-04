import { redirect } from 'next/navigation';

export default function LegacyNewClaimPage() {
  redirect('/farmer/requests');
}
