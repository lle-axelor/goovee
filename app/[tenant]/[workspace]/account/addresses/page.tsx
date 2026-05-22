import {redirect} from 'next/navigation';
import {workspacePathname} from '@/utils/workspace';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const {workspaceURI} = workspacePathname(params);

  // Preserve quotation/checkout context when redirecting
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value == null) continue;
    if (Array.isArray(value)) value.forEach(v => sp.append(key, v));
    else sp.append(key, value);
  }
  const query = sp.toString();
  redirect(`${workspaceURI}/account/security${query ? `?${query}` : ''}`);
}
