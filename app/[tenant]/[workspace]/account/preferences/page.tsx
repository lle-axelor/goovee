import {redirect} from 'next/navigation';
import {workspacePathname} from '@/utils/workspace';

// MBI: tab removed from the account rail — see ACCOUNT_TABS.
export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const {workspaceURI} = workspacePathname(params);
  redirect(`${workspaceURI}/account/personal`);
}
