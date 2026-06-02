'use client';

import {MdOutlineFileDownload} from 'react-icons/md';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {download} from '@/utils/files';
import {SUBAPP_CODES} from '@/constants';
import type {DmsFile} from '@/subapps/resources/common/types';
import {useTrack} from '@/lib/analytics/use-track';

export default function DownloadIcon({record}: {record: DmsFile}) {
  const {workspaceURI} = useWorkspace();
  const trackEvent = useTrack(SUBAPP_CODES.resources);
  const href = `${workspaceURI}/${SUBAPP_CODES.resources}/api/file/${record?.id}`;

  const handleDownload = () => {
    trackEvent('download_resource', {
      file_id: record?.id != null ? String(record.id) : undefined,
      file_name: record?.fileName,
      file_type: record?.metaFile?.fileType,
      file_size: record?.metaFile?.fileSize,
    });
    download(record, href);
  };

  return (
    <>
      <MdOutlineFileDownload
        className="h-10 w-10 bg-success-light text-success cursor-pointer"
        onClick={handleDownload}
      />
    </>
  );
}
