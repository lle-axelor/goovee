'use client';

import {useRef, useState} from 'react';
import Link from 'next/link';
import {
  MdArrowBack,
  MdArrowForward,
  MdOutlineForum,
  MdAutoAwesome,
  MdCheck,
  MdReply,
  MdKeyboardArrowUp,
  MdKeyboardArrowDown,
  MdAttachFile,
  MdClose,
} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import {formatRelativeTime} from '@/locale/formatters';
import {getPartnerImageURL} from '@/utils/files';
import {RichTextViewer} from '@/ui/components';
import {SUBAPP_CODES} from '@/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useComments} from '@/comments/hooks';
import {SORT_TYPE} from '@/comments/constants';

// ---- LOCAL IMPORTS ---- //
import {COMMENTS_PER_LOAD} from '@/subapps/forum/common/constants';
import {
  fetchComments,
  createComment,
} from '@/subapps/forum/common/action/action';

type AnyRec = any;

/**
 * Deterministic synthetic vote count — the data model has no vote/like field,
 * so we derive a stable pseudo-count from the record id for the maquette.
 * See the note returned to the team for the expected API model.
 */
function synthVotes(id: any): number {
  const n = Number(String(id ?? '').replace(/\D/g, '')) || 0;
  return (n % 23) + 2;
}

function initialsOf(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Avatar({
  name,
  pictureId,
  tenant,
  size = 34,
}: {
  name?: string | null;
  pictureId?: any;
  tenant: string;
  size?: number;
}) {
  const url = pictureId ? getPartnerImageURL(pictureId, tenant) : null;
  return (
    <span
      className="rounded-full overflow-hidden bg-gradient-to-br from-royal to-royal-dark grid place-items-center text-white font-bold shrink-0"
      style={{width: size, height: size, fontSize: size * 0.36}}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={name || ''}
          className="w-full h-full object-cover"
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}

function firstNameOf(name?: string | null): string {
  if (!name) return '';
  return name.trim().split(/\s+/)[0] || '';
}

/**
 * One real nested reply (a child mail_message of a top-level comment),
 * rendered beneath the message it answers. Persisted through the same
 * `createComment` action as top-level comments, with a `parentId`.
 */
function NestedReplyItem({
  child,
  parentName,
  tenant,
}: {
  child: AnyRec;
  parentName?: string | null;
  tenant: string;
}) {
  const author =
    child.partner?.simpleFullName ||
    child.partner?.name ||
    child.createdBy?.fullName;
  const body = child.note || child.body;
  const relative = child.createdOn ? formatRelativeTime(child.createdOn) : '';

  return (
    <div className="bg-white border border-ink-100 rounded-xl shadow-xs p-3.5">
      <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
        <Avatar
          name={author}
          pictureId={child.partner?.picture?.id}
          tenant={tenant}
          size={28}
        />
        <span className="text-[13px] font-bold text-ink-900">{author}</span>
        <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-px rounded-full bg-royal-pale text-royal-dark">
          <MdReply className="size-3 -scale-x-100" />
          {i18n.t('in reply to {0}', firstNameOf(parentName))}
        </span>
        {relative && (
          <span className="text-[11px] text-ink-500">· {relative}</span>
        )}
      </div>
      <RichTextViewer
        content={body || ''}
        className="pl-[38px] text-[13.5px] text-ink-800"
        innerHTMLClassName="leading-[1.6] break-words"
      />
    </div>
  );
}

function ForumMessage({
  author,
  meta,
  pictureId,
  tenant,
  body,
  votes,
  nestedReplies = [],
  canReply = false,
  onReply,
  isOriginal = false,
  isBestAnswer = false,
}: {
  author?: string | null;
  meta?: string | null;
  pictureId?: any;
  tenant: string;
  body?: string | null;
  votes: number;
  nestedReplies?: AnyRec[];
  canReply?: boolean;
  onReply?: (text: string) => Promise<void> | void;
  isOriginal?: boolean;
  isBestAnswer?: boolean;
}) {
  // State is local to each message — opening one composer never affects another.
  const [replyOpen, setReplyOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const targetName = author || i18n.t('the author');

  const submitReply = async () => {
    const text = draft.trim();
    if (!text || submitting || !onReply) return;
    setSubmitting(true);
    try {
      await onReply(text);
      setDraft('');
      setReplyOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div
        className={cn(
          'relative bg-white rounded-xl p-[18px]',
          isBestAnswer
            ? 'border-[1.5px] border-mint-500 shadow-sm'
            : 'border border-ink-100',
          isOriginal && !isBestAnswer && 'shadow-sm',
        )}>
        {isBestAnswer && (
          <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-mint-500 text-white text-[10.5px] font-bold">
            <MdCheck className="size-3" />
            {i18n.t('Best answer')}
          </span>
        )}
        <div className="flex gap-3.5">
          {/* Vote rail (synthetic — no model support yet) */}
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <button
              type="button"
              aria-label={i18n.t('Upvote')}
              className="w-[30px] h-[26px] rounded-md border border-ink-150 bg-white grid place-items-center text-mint-500 hover:bg-mint-50 transition-colors">
              <MdKeyboardArrowUp className="size-4" />
            </button>
            <span className="text-sm font-extrabold text-ink-900 tabular-nums">
              {votes}
            </span>
            <button
              type="button"
              aria-label={i18n.t('Downvote')}
              className="w-[30px] h-[26px] rounded-md border border-ink-150 bg-white grid place-items-center text-ink-400 hover:bg-ink-25 transition-colors">
              <MdKeyboardArrowDown className="size-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-2">
              <Avatar name={author} pictureId={pictureId} tenant={tenant} />
              <div className="min-w-0">
                <div className="text-[13.5px] font-bold text-ink-900 flex items-center gap-2">
                  <span className="truncate">{author}</span>
                  {isOriginal && (
                    <span className="shrink-0 text-[10px] font-bold px-1.5 py-px rounded-full bg-royal-pale text-royal-dark uppercase tracking-wide">
                      {i18n.t('Author')}
                    </span>
                  )}
                </div>
                {meta && (
                  <div className="text-[11.5px] text-ink-500 truncate">
                    {meta}
                  </div>
                )}
              </div>
            </div>
            <RichTextViewer
              content={body || ''}
              className="text-sm text-ink-800"
              innerHTMLClassName="leading-[1.65] break-words"
            />
            <div className="flex items-center gap-4 mt-3 text-[12.5px] text-ink-600">
              <button
                type="button"
                onClick={() => setReplyOpen(o => !o)}
                disabled={!canReply}
                className={cn(
                  'inline-flex items-center gap-1.5 font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                  replyOpen ? 'text-royal' : 'hover:text-royal',
                )}>
                <MdReply className="size-3.5" />
                {i18n.t('Reply')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nested thread: real replies + inline composer, linked by a royal left border */}
      {(nestedReplies.length > 0 || replyOpen) && (
        <div className="ml-6 mt-2 border-l-2 border-royal pl-4 flex flex-col gap-2">
          {nestedReplies.map((child: AnyRec) => (
            <NestedReplyItem
              key={child.id}
              child={child}
              parentName={author}
              tenant={tenant}
            />
          ))}

          {replyOpen && (
            <div className="bg-white border border-ink-100 rounded-xl shadow-xs p-3.5">
              <div className="text-[12px] font-semibold text-ink-700 mb-2">
                {i18n.t('In reply to {0}', targetName)}
              </div>
              <textarea
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder={i18n.t('Reply to {0}…', firstNameOf(targetName))}
                rows={2}
                disabled={submitting}
                className="w-full border border-ink-150 rounded-[10px] px-3 py-2.5 text-[13.5px] resize-y outline-none text-ink-800 focus:border-royal transition-colors disabled:bg-ink-25 box-border"
              />
              <div className="flex justify-end items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDraft('');
                    setReplyOpen(false);
                  }}
                  className="px-3.5 py-2 rounded-[10px] text-[13px] font-semibold text-ink-600 hover:bg-ink-100 transition-colors">
                  {i18n.t('Cancel')}
                </button>
                <button
                  type="button"
                  onClick={submitReply}
                  disabled={!draft.trim() || submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-royal text-white text-[13px] font-bold hover:bg-royal-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <MdReply className="size-3.5" />
                  {i18n.t('Reply')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatRow({label, value}: {label: string; value: React.ReactNode}) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <span className="text-ink-500">{label}</span>
      <span className="font-bold text-ink-900 text-right">{value}</span>
    </div>
  );
}

export function ForumDetail({
  post,
  replyCount = 0,
  groupMeta = {memberCount: 0, postCount: 0},
  related = [],
  currentUser,
  canComment = false,
  backHref,
}: {
  post: AnyRec;
  replyCount?: number;
  groupMeta?: {memberCount: number; postCount: number};
  related?: AnyRec[];
  currentUser?: {name?: string | null; pictureId?: any} | null;
  canComment?: boolean;
  backHref: string;
}) {
  const {workspaceURI, tenant} = useWorkspace();
  const [draft, setDraft] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {comments, totalMainThread, hasMore, loadMore, creating, onCreate} =
    useComments({
      sortBy: SORT_TYPE.old,
      recordId: post.id,
      subapp: SUBAPP_CODES.forum,
      limit: COMMENTS_PER_LOAD,
      fetchComments,
      createComment,
    });

  const group = post.forumGroup?.name;
  const groupId = post.forumGroup?.id;
  const groupHref = groupId
    ? `${workspaceURI}/${SUBAPP_CODES.forum}/group/${groupId}`
    : backHref;
  const date = post.postDateT || post.createdOn;
  const postVotes = synthVotes(post.id);
  const replyTotal = totalMainThread || replyCount;

  // Synthetic "best answer": the reply with the most (synthetic) votes.
  const bestAnswerId =
    comments.length > 0
      ? comments
          .map((c: AnyRec) => ({id: c.id, v: synthVotes(c.id)}))
          .sort((a, b) => b.v - a.v)[0]?.id
      : null;
  const isResolved = comments.length > 0;

  const pickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length) setFiles(prev => [...prev, ...picked]);
    e.target.value = '';
  };

  const removeFile = (index: number) =>
    setFiles(prev => prev.filter((_, i) => i !== index));

  const submit = async () => {
    const text = draft.trim();
    if ((!text && !files.length) || creating) return;
    await onCreate({
      data: {
        text,
        attachments: files.map(file => ({
          title: file.name,
          description: '',
          file,
        })),
      },
    });
    setDraft('');
    setFiles([]);
  };

  return (
    <div className="bg-ink-25 min-h-full">
      <div className="container py-8 mx-auto mb-20 lg:mb-0">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink-500 hover:text-royal mb-5 transition-colors">
          <MdArrowBack className="size-4" />
          {i18n.t('Back to forum')}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
          {/* Conversation column */}
          <div className="min-w-0">
            {/* Group banner + title + meta */}
            <div className="mb-4">
              {group && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-royal-pale border border-royal-border text-royal-dark text-[12px] font-bold mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-royal" />
                  {group}
                </span>
              )}
              <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-ink-900 leading-tight">
                {post.title}
              </h1>
              <div className="mt-2 flex items-center gap-3.5 text-[12.5px] text-ink-500 flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <MdOutlineForum className="size-3.5" />
                  {i18n.t('{0} replies', String(replyTotal))}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MdAutoAwesome className="size-3.5 text-mint-500" />
                  {i18n.t('{0} votes', String(postVotes))}
                </span>
                {date && <span>· {formatRelativeTime(date)}</span>}
              </div>
            </div>

            {/* Original post */}
            <ForumMessage
              author={post.author?.simpleFullName}
              meta={date ? formatRelativeTime(date) : null}
              pictureId={post.author?.picture?.id}
              tenant={tenant}
              body={post.content}
              votes={postVotes}
              canReply={canComment}
              onReply={text => onCreate({data: {text, attachments: []}})}
              isOriginal
            />

            {/* Replies header */}
            <div className="flex items-center gap-2.5 mt-6 mb-3.5">
              <h2 className="text-[15px] font-bold text-ink-900">
                {i18n.t('{0} replies', String(replyTotal))}
              </h2>
              <div className="flex-1 h-px bg-ink-100" />
              <span className="text-[12px] text-ink-500">
                {i18n.t('Sort:')}{' '}
                <strong className="text-ink-700">
                  {i18n.t('Most helpful')}
                </strong>
              </span>
            </div>

            {/* Replies */}
            <div className="flex flex-col gap-3">
              {comments.map((c: AnyRec) => {
                const author =
                  c.partner?.simpleFullName ||
                  c.partner?.name ||
                  c.createdBy?.fullName;
                return (
                  <ForumMessage
                    key={c.id}
                    author={author}
                    meta={c.createdOn ? formatRelativeTime(c.createdOn) : null}
                    pictureId={c.partner?.picture?.id}
                    tenant={tenant}
                    body={c.note || c.body}
                    votes={synthVotes(c.id)}
                    nestedReplies={c.childMailMessages || []}
                    canReply={canComment}
                    onReply={text =>
                      onCreate({data: {text, attachments: []}, parent: c.id})
                    }
                    isBestAnswer={String(c.id) === String(bestAnswerId)}
                  />
                );
              })}
              {comments.length === 0 && (
                <div className="bg-white border border-ink-100 rounded-xl shadow-xs py-10 text-center text-[13px] text-ink-500">
                  {i18n.t('No reply yet. Start the conversation!')}
                </div>
              )}
              {hasMore && (
                <button
                  type="button"
                  onClick={loadMore}
                  className="self-center mt-1 px-4 py-2 rounded-lg text-[13px] font-semibold text-royal-dark bg-royal-pale border border-royal-border hover:bg-royal-pale/70 transition-colors">
                  {i18n.t('Load more replies')}
                </button>
              )}
            </div>

            {/* Reply composer */}
            <div className="mt-5 bg-white border border-ink-100 rounded-xl shadow-xs p-4">
              <div className="flex gap-3">
                <Avatar
                  name={currentUser?.name}
                  pictureId={currentUser?.pictureId}
                  tenant={tenant}
                  size={36}
                />
                <div className="flex-1 min-w-0">
                  <textarea
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    placeholder={
                      canComment
                        ? i18n.t('Write a reply…')
                        : i18n.t('Join the group to comment')
                    }
                    rows={3}
                    disabled={!canComment || creating}
                    className="w-full border border-ink-150 rounded-[10px] px-3 py-2.5 text-[13.5px] resize-y outline-none text-ink-800 focus:border-royal transition-colors disabled:bg-ink-25 disabled:cursor-not-allowed box-border"
                  />
                  <div className="flex justify-between items-center gap-3 mt-2.5">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={pickFiles}
                        disabled={!canComment}
                      />
                      <button
                        type="button"
                        disabled={!canComment}
                        onClick={() => fileInputRef.current?.click()}
                        aria-label={i18n.t('Attach files')}
                        title={i18n.t('Attach files')}
                        className="w-[30px] h-[30px] rounded-md grid place-items-center text-ink-500 hover:bg-ink-100 transition-colors disabled:opacity-40 disabled:hover:bg-transparent">
                        <MdAttachFile className="size-4" />
                      </button>
                      {files.map((f, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 max-w-[180px] pl-2.5 pr-1 py-1 rounded-full bg-ink-25 border border-ink-150 text-[11.5px] text-ink-700">
                          <span className="truncate">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            aria-label={i18n.t('Remove')}
                            className="shrink-0 grid place-items-center size-4 rounded-full text-ink-500 hover:bg-ink-150 hover:text-ink-800 transition-colors">
                            <MdClose className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={submit}
                      disabled={
                        !canComment ||
                        creating ||
                        (!draft.trim() && !files.length)
                      }
                      className="shrink-0 inline-flex items-center gap-1.5 px-[18px] py-2.5 rounded-[10px] bg-royal text-white text-[13px] font-bold shadow-[0_1px_2px_rgba(13,30,75,0.15),0_4px_12px_rgba(13,30,75,0.12)] hover:bg-royal-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      {i18n.t('Post reply')}
                      <MdArrowForward className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-6 flex flex-col gap-5">
            {/* Group card */}
            {group && (
              <div className="bg-white border border-ink-100 rounded-xl shadow-xs p-[18px]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-[42px] h-[42px] rounded-[10px] bg-royal grid place-items-center text-white shrink-0">
                    <MdOutlineForum className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-bold text-ink-900 leading-tight truncate">
                      {group}
                    </div>
                    <div className="text-[11.5px] text-ink-500">
                      {i18n.t('{0} members', String(groupMeta.memberCount))} ·{' '}
                      {i18n.t('{0} posts', String(groupMeta.postCount))}
                    </div>
                  </div>
                </div>
                <Link
                  href={groupHref}
                  className="block w-full text-center py-2.5 rounded-[10px] bg-royal-pale text-royal-dark border border-royal-border text-[12.5px] font-bold hover:bg-royal-pale/70 transition-colors">
                  {canComment
                    ? i18n.t('View the group')
                    : i18n.t('Join the group')}
                </Link>
              </div>
            )}

            {/* About */}
            <div className="bg-white border border-ink-100 rounded-xl shadow-xs p-[18px]">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-500 mb-3">
                {i18n.t('About this discussion')}
              </h3>
              <div className="flex flex-col gap-2.5">
                {date && (
                  <StatRow
                    label={i18n.t('Created')}
                    value={formatRelativeTime(date)}
                  />
                )}
                <StatRow label={i18n.t('Replies')} value={String(replyTotal)} />
                <StatRow label={i18n.t('Votes')} value={String(postVotes)} />
                <StatRow
                  label={i18n.t('Status')}
                  value={
                    isResolved ? (
                      <span className="text-mint-500 font-bold">
                        {i18n.t('Resolved')}
                      </span>
                    ) : (
                      <span className="text-ink-500 font-bold">
                        {i18n.t('Open')}
                      </span>
                    )
                  }
                />
              </div>
            </div>

            {/* Related */}
            {related.length > 0 && (
              <div className="bg-white border border-ink-100 rounded-xl shadow-xs p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-500 mb-2.5">
                  {i18n.t('Related discussions')}
                </h3>
                <div className="flex flex-col">
                  {related.slice(0, 4).map((r: AnyRec) => (
                    <Link
                      key={r.id}
                      href={`${backHref}/post/${r.id}`}
                      className="py-2 border-t border-ink-100 first:border-t-0 group">
                      <div className="text-[12.5px] font-semibold text-ink-900 leading-snug line-clamp-2 group-hover:text-royal transition-colors">
                        {r.title}
                      </div>
                      <div className="text-[11px] text-ink-500 mt-0.5">
                        {i18n.t('{0} replies', String(r.replyCount ?? 0))}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

export default ForumDetail;
