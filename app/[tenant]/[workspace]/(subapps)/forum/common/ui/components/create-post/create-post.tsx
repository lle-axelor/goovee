'use client';

import React, {useState} from 'react';
import {
  MdClose,
  MdOutlineEdit,
  MdOutlineForum,
  MdOutlineImage,
  MdOutlineUploadFile,
  MdKeyboardArrowDown,
  MdAutoAwesome,
} from 'react-icons/md';
import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import {RichTextEditor} from '@/ui/components';
import {useToast} from '@/ui/hooks/use-toast';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

// ---- LOCAL IMPORTS ---- //
import {PUBLISHING} from '@/subapps/forum/common/constants';
import {
  FilePreviewer,
  ImagePreviewer,
  FileUploader,
  ImageUploader,
} from '@/subapps/forum/common/ui/components';
import {addPost} from '@/subapps/forum/common/action/action';

interface ImageItem {
  file: File;
  altText: string;
}

interface CreatePostProps {
  groups: any[];
  selectedGroup: any;
  onClose: () => void;
}

enum ModalType {
  None = 'none',
  Image = 'image',
  File = 'file',
}

// Group records carry no color — derive a stable pastille color from the name.
const PASTILLE_COLORS = [
  'palette-indigo',
  'palette-blue',
  'palette-purple',
  'palette-teal',
  'palette-cyan',
  'palette-green',
  'palette-orange',
  'palette-pink',
  'palette-red',
  'palette-deeppurple',
];

function groupColorClass(name = ''): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return `bg-${PASTILLE_COLORS[hash % PASTILLE_COLORS.length]}`;
}

function stripHtml(html?: string) {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function GroupPastille({name, size = 24}: {name?: string; size?: number}) {
  return (
    <span
      className={cn(
        'grid place-items-center rounded-md text-white font-bold shrink-0',
        groupColorClass(name || ''),
      )}
      style={{width: size, height: size, fontSize: size * 0.5}}>
      {(name || '#').trim().charAt(0).toUpperCase()}
    </span>
  );
}

export const CreatePost = ({
  groups,
  selectedGroup = null,
  onClose,
}: CreatePostProps) => {
  const [title, setTitle] = useState('');
  const [groupId, setGroupId] = useState<string>(selectedGroup?.id || '');
  const [editorContent, setEditorContent] = useState<string>('');
  const [attachments, setAttachments] = useState<{
    images: ImageItem[];
    file?: any;
  }>({images: []});
  const [modalOpen, setModalOpen] = useState<ModalType>(ModalType.None);
  const [groupOpen, setGroupOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const {toast} = useToast();
  const {workspaceURI, workspaceURL} = useWorkspace();
  const router = useRouter();

  const chosenGroup = groups?.find(g => String(g.id) === String(groupId));
  const valid = Boolean(title.trim() && groupId && stripHtml(editorContent));

  const handleOpen = (type: ModalType) => setModalOpen(type);
  const handleClose = () => setModalOpen(ModalType.None);

  const handleImageUpload = (images: ImageItem[]) =>
    setAttachments(prev => ({...prev, images}));

  const handleFileUpload = (newFile: any) =>
    setAttachments(prev => ({
      ...prev,
      title: newFile?.fileTitle || newFile?.file?.name,
      file: newFile,
    }));

  const handlePost = async () => {
    if (!valid || loading) return;
    setLoading(true);

    const formData = new FormData();
    if (attachments.images?.length) {
      attachments.images.forEach((element: any, index) => {
        formData.append(
          `attachmentList[${index}][title]`,
          element?.altText || '',
        );
        formData.append(`attachmentList[${index}][file]`, element.file);
      });
    } else if (attachments.file) {
      formData.append(
        `attachmentList[0][title]`,
        attachments.file?.fileTitle || '',
      );
      formData.append(`attachmentList[0][file]`, attachments.file?.file);
    }

    try {
      const result: any = await addPost({
        group: {id: selectedGroup?.id || groupId},
        title,
        content: editorContent,
        workspaceURL,
        workspaceURI,
        formData,
      });

      if (result.success) {
        toast({variant: 'success', title: i18n.t('Post added successfully.')});
        onClose();
        router.refresh();
      } else {
        toast({
          variant: 'destructive',
          title: i18n.t(result.message ?? 'Something went wrong'),
        });
      }
    } catch (error) {
      console.error('Post creation error:', error);
      toast({variant: 'destructive', title: i18n.t('An error occurred!')});
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header — royal gradient + dots pattern */}
      <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-royal-dark to-royal px-6 py-[22px] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        />
        <button
          type="button"
          onClick={onClose}
          aria-label={i18n.t('Close')}
          className="absolute right-4 top-4 z-10 grid size-8 place-items-center rounded-lg bg-white/15 text-white transition-colors hover:bg-white/25">
          <MdClose className="size-4" />
        </button>
        <div className="relative flex items-center gap-3.5">
          <div className="grid size-11 shrink-0 place-items-center rounded-[11px] bg-white/[0.18]">
            <MdOutlineForum className="size-5" />
          </div>
          <div>
            <h2 className="text-[19px] font-extrabold tracking-[-0.015em]">
              {i18n.t('New discussion')}
            </h2>
            <p className="mt-0.5 text-[13px] text-white/85">
              {i18n.t('Share a question or a tip with the community')}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto p-6">
        {/* Title */}
        <div>
          <label className="mb-2 block text-[13px] font-bold text-ink-800">
            {i18n.t('Title')} <span className="text-destructive">*</span>
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={i18n.t('Summarize your topic in one sentence')}
            className="w-full rounded-[10px] border border-ink-150 px-3.5 py-3 text-[15px] font-semibold text-ink-800 outline-none transition-colors placeholder:font-normal placeholder:text-ink-400 focus:border-royal"
          />
        </div>

        {/* Group — custom selector */}
        <div className="relative">
          <label className="mb-2 block text-[13px] font-bold text-ink-800">
            {i18n.t('Group')} <span className="text-destructive">*</span>
          </label>
          <button
            type="button"
            onClick={() => setGroupOpen(o => !o)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-[10px] border px-3.5 py-3 text-left transition-colors',
              groupOpen ? 'border-royal' : 'border-ink-150',
            )}>
            {chosenGroup ? (
              <>
                <GroupPastille name={chosenGroup.name} />
                <span className="flex-1 truncate text-sm font-semibold text-ink-900">
                  {chosenGroup.name}
                </span>
              </>
            ) : (
              <span className="flex-1 text-sm text-ink-400">
                {i18n.t('Select a group')}
              </span>
            )}
            <MdKeyboardArrowDown
              className={cn(
                'size-4 shrink-0 text-ink-400 transition-transform',
                groupOpen && 'rotate-180',
              )}
            />
          </button>
          {groupOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setGroupOpen(false)}
              />
              <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-[260px] overflow-y-auto rounded-xl border border-ink-100 bg-white shadow-lg">
                {groups?.map(g => {
                  const active = String(g.id) === String(groupId);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setGroupId(String(g.id));
                        setGroupOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors',
                        active ? 'bg-royal-pale' : 'hover:bg-ink-25',
                      )}>
                      <GroupPastille name={g.name} size={26} />
                      <span className="flex-1 truncate text-[13.5px] font-semibold text-ink-900">
                        {g.name}
                      </span>
                      <span className="shrink-0 rounded-full bg-royal-pale px-2 py-px text-[10px] font-bold text-royal-dark">
                        {i18n.t('Member')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Content — reused rich-text editor */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-[13px] font-bold text-ink-800">
              {i18n.t('Content')} <span className="text-destructive">*</span>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={i18n.t('Add image')}
                title={i18n.t('Add image')}
                onClick={() => handleOpen(ModalType.Image)}
                className="grid size-7 place-items-center rounded-md text-ink-500 transition-colors hover:bg-ink-100">
                <MdOutlineImage className="size-4" />
              </button>
              <button
                type="button"
                aria-label={i18n.t('Attach files')}
                title={i18n.t('Attach files')}
                onClick={() => handleOpen(ModalType.File)}
                className="grid size-7 place-items-center rounded-md text-ink-500 transition-colors hover:bg-ink-100">
                <MdOutlineUploadFile className="size-4" />
              </button>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-ink-150">
            <RichTextEditor
              onChange={setEditorContent}
              classNames={{
                toolbarClassName: '!bg-ink-25 !border-ink-100 !mt-0',
                wrapperClassName: '!border-0 !rounded-none',
                editorClassName: '!min-h-[180px] px-4 !text-ink-800 text-sm',
              }}
            />
          </div>

          {/* Attachment previews */}
          {attachments.images.length > 0 ? (
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleOpen(ModalType.Image)}
                className="self-end text-ink-500 hover:text-royal">
                <MdOutlineEdit className="size-5" />
              </button>
              <ImagePreviewer images={attachments.images} />
            </div>
          ) : attachments?.file?.file ? (
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleOpen(ModalType.File)}
                className="self-end text-ink-500 hover:text-royal">
                <MdOutlineEdit className="size-5" />
              </button>
              <FilePreviewer file={attachments.file.file} />
            </div>
          ) : null}
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-ink-100 px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-[10px] border border-ink-150 bg-white px-[18px] py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-25">
          {i18n.t('Cancel')}
        </button>
        <button
          type="button"
          onClick={handlePost}
          disabled={!valid || loading}
          className="inline-flex items-center gap-2 rounded-[10px] bg-royal px-[22px] py-2.5 text-sm font-bold text-white shadow-[0_1px_2px_rgba(13,30,75,0.15),0_6px_14px_rgba(13,30,75,0.18)] transition-colors hover:bg-royal-dark disabled:cursor-not-allowed disabled:bg-ink-200 disabled:shadow-none">
          <MdAutoAwesome className="size-4" />
          {loading ? i18n.t(PUBLISHING) : i18n.t('Publish the discussion')}
        </button>
      </div>

      {modalOpen === ModalType.Image && (
        <ImageUploader
          initialValue={attachments.images}
          open={modalOpen === ModalType.Image}
          onUpload={handleImageUpload}
          handleClose={handleClose}
        />
      )}

      {modalOpen === ModalType.File && (
        <FileUploader
          open={modalOpen === ModalType.File}
          initialValue={attachments.file}
          onUpload={handleFileUpload}
          handleClose={handleClose}
        />
      )}
    </>
  );
};

export default CreatePost;
