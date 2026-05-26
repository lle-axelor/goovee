import {Suspense} from 'react';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {
  MdChevronLeft,
  MdChevronRight,
  MdFilterList,
  MdGridView,
} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findWorkspace} from '@/orm/workspace';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {Button} from '@/ui/components';
import {ORDER_BY, SUBAPP_CODES} from '@/constants';
import {t} from '@/lib/core/locale/server';
import {manager} from '@/tenant';
import {cn} from '@/utils/css';

// ---- LOCAL IMPORTS ---- //
import {EVENT_TYPE} from '@/subapps/events/common/constants';
import {findEvents} from '@/subapps/events/common/orm/event';

const FETCH_LIMIT = 200;

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

type SearchParams = {year?: string; month?: string};

export default async function Page(context: {
  params: Promise<{tenant: string; workspace: string}>;
  searchParams: Promise<SearchParams>;
}) {
  const params = await context.params;
  const searchParams = await context.searchParams;
  const {tenant: tenantId} = params;

  const session = await getSession();
  const user = session?.user;

  const {workspaceURL, workspaceURI} = workspacePathname(params);

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  }).then(clone);
  if (!workspace) return notFound();

  const now = new Date();
  const year = Number(searchParams.year) || now.getFullYear();
  const month = Number(searchParams.month) || now.getMonth() + 1;

  return (
    <main className="bg-ink-25 w-full flex-1 min-h-0 flex flex-col">
      <Suspense fallback={<CalendarSkeleton />}>
        <Calendar
          workspace={workspace}
          user={user}
          client={client}
          workspaceURI={workspaceURI}
          year={year}
          month={month}
        />
      </Suspense>
    </main>
  );
}

async function Calendar({
  workspace,
  user,
  client,
  workspaceURI,
  year,
  month,
}: {
  workspace: any;
  user: any;
  client: any;
  workspaceURI: string;
  year: number;
  month: number;
}) {
  const monthResult: any = await findEvents({
    limit: FETCH_LIMIT,
    page: 1,
    categoryids: [],
    month,
    year,
    eventType: EVENT_TYPE.ACTIVE,
    workspace,
    client,
    user,
    orderBy: {eventStartDateTime: ORDER_BY.ASC},
  }).then(clone);

  const events: any[] = monthResult?.events ?? [];

  const grid = buildMonthGrid(year, month);
  const eventsByDay = groupEventsByDay(events, year, month);

  const monthLabel = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));

  const today = new Date();
  const todayDay =
    today.getFullYear() === year && today.getMonth() + 1 === month
      ? today.getDate()
      : -1;

  const prev = previousMonth(year, month);
  const next = nextMonth(year, month);

  const calendarBase = `${workspaceURI}/${SUBAPP_CODES.events}/calendar`;
  const magazineHref = `${workspaceURI}/${SUBAPP_CODES.events}`;

  const eventsThisMonth = events.length;

  const categoryMap = new Map<
    string,
    {id: string; name: string; color: string | null}
  >();
  events.forEach(event => {
    event.eventCategorySet?.forEach((cat: any) => {
      if (cat && !categoryMap.has(cat.id)) {
        categoryMap.set(cat.id, cat);
      }
    });
  });

  const [
    title,
    subtitle,
    backLabel,
    filtersLabel,
    todayLabel,
    eventsLabel,
    categoriesLabel,
    moreLabel,
    ...weekdayLabels
  ] = await Promise.all([
    t('Calendar'),
    t('Monthly view of Atlas events and trainings'),
    t('Magazine view'),
    t('Filters'),
    t('Today'),
    t(eventsThisMonth > 1 ? 'events this month' : 'event this month'),
    t('Categories'),
    t('more'),
    ...WEEKDAYS.map(day => t(day)),
  ]);

  return (
    <div className="py-8 container mx-auto max-w-[1280px]">
      <header className="mb-6">
        <h1 className="text-[32px] font-extrabold text-ink-900 tracking-[-0.025em] leading-tight">
          {title}
        </h1>
        <p className="mt-1 text-sm text-ink-500">{subtitle}</p>
      </header>

      <div className="flex justify-end gap-2 mb-6">
        <Button asChild variant="ink-outline" size="sm" className="gap-1.5">
          <Link href={magazineHref}>
            <MdGridView className="text-base" />
            {backLabel}
          </Link>
        </Button>
        <Button variant="ink-outline" size="sm" className="gap-1.5" disabled>
          <MdFilterList className="text-base" />
          {filtersLabel}
        </Button>
      </div>

      <section className="bg-white border border-ink-100 rounded-2xl shadow-xs overflow-hidden mb-5">
        {/* Month nav */}
        <div className="flex items-center justify-between px-6 py-[18px] border-b border-ink-100">
          <div className="flex items-center gap-3.5">
            <Link
              href={`${calendarBase}?year=${prev.year}&month=${prev.month}`}
              aria-label="Previous month"
              className="w-9 h-9 rounded-[10px] bg-ink-50 grid place-items-center text-ink-700 hover:bg-ink-100 transition-colors">
              <MdChevronLeft className="text-base" />
            </Link>
            <h2 className="m-0 text-[22px] font-bold text-ink-900 tracking-[-0.015em] capitalize">
              {monthLabel}
            </h2>
            <Link
              href={`${calendarBase}?year=${next.year}&month=${next.month}`}
              aria-label="Next month"
              className="w-9 h-9 rounded-[10px] bg-ink-50 grid place-items-center text-ink-700 hover:bg-ink-100 transition-colors">
              <MdChevronRight className="text-base" />
            </Link>
            <Link
              href={calendarBase}
              className="ml-1.5 inline-flex items-center px-3.5 py-2 rounded-lg border border-royal-border bg-white text-royal text-xs font-bold hover:bg-royal-pale transition-colors">
              {todayLabel}
            </Link>
          </div>
          <div className="text-[12.5px] text-ink-600">
            <span className="font-bold text-ink-900 tabular-nums">
              {eventsThisMonth}
            </span>{' '}
            {eventsLabel}
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-ink-100 bg-ink-25">
          {weekdayLabels.map((label, i) => (
            <div
              key={WEEKDAYS[i]}
              className={cn(
                'px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em] border-r border-ink-100 last:border-r-0',
                i >= 5 ? 'text-status-cancelled-fg' : 'text-ink-500',
              )}>
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7">
          {grid.map((cell, i) => {
            const dayOfWeek = i % 7;
            const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
            const isToday = cell != null && cell === todayDay;
            const dayEvents = cell != null ? (eventsByDay.get(cell) ?? []) : [];
            return (
              <div
                key={i}
                className={cn(
                  'min-h-[130px] px-2 pt-2 pb-1.5 flex flex-col gap-1 border-r border-b border-ink-100 last:border-r-0 [&:nth-child(7n)]:border-r-0',
                  cell == null
                    ? 'bg-[#fafbfc]'
                    : isWeekend
                      ? 'bg-[#fcfcfd]'
                      : 'bg-white',
                )}>
                {cell != null && (
                  <div className="flex items-center justify-between mb-0.5">
                    {isToday ? (
                      <span className="w-[26px] h-[26px] rounded-full bg-mint-500 text-white grid place-items-center font-extrabold text-[13px] tabular-nums">
                        {cell}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          'text-[13.5px] font-bold px-2 py-0.5 tabular-nums',
                          isWeekend ? 'text-ink-400' : 'text-ink-700',
                        )}>
                        {cell}
                      </span>
                    )}
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-royal-pale text-royal-dark font-bold tabular-nums">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>
                )}
                {dayEvents.slice(0, 3).map(event => (
                  <CalendarEventPill
                    key={event.id}
                    event={event}
                    workspaceURI={workspaceURI}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[10.5px] text-ink-500 font-semibold px-2">
                    + {dayEvents.length - 3} {moreLabel}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Legend */}
      {categoryMap.size > 0 && (
        <div className="flex items-center gap-[18px] flex-wrap px-[18px] py-3.5 bg-white border border-ink-100 rounded-xl">
          <span className="text-xs font-bold text-ink-700 uppercase tracking-[0.04em]">
            {categoriesLabel}
          </span>
          {Array.from(categoryMap.values()).map(cat => (
            <span
              key={cat.id}
              className="inline-flex items-center gap-[7px] text-xs text-ink-700">
              <span
                className="w-3 h-3 rounded-[3px]"
                style={{
                  backgroundColor: `var(--palette-${cat.color ?? 'blue'}-dark)`,
                }}
              />
              {cat.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Building blocks ---- //

function CalendarEventPill({
  event,
  workspaceURI,
}: {
  event: any;
  workspaceURI: string;
}) {
  const cat = event.eventCategorySet?.[0];
  const color = cat?.color ?? 'blue';
  const detailHref = `${workspaceURI}/${SUBAPP_CODES.events}/${event.slug}`;
  const startTime = event.eventStartDateTime
    ? formatHHmm(event.eventStartDateTime)
    : '';

  return (
    <Link
      href={detailHref}
      title={event.eventTitle}
      className="flex items-center gap-1.5 px-2 py-1 rounded-md border-l-[3px] text-[11px] font-semibold leading-tight overflow-hidden truncate"
      style={{
        backgroundColor: `var(--palette-${color}-light)`,
        color: `var(--palette-${color}-dark)`,
        borderLeftColor: `var(--palette-${color}-dark)`,
      }}>
      {startTime && (
        <span className="font-extrabold font-mono text-[10px]">
          {startTime}
        </span>
      )}
      <span className="flex-1 min-w-0 truncate">{event.eventTitle}</span>
    </Link>
  );
}

function CalendarSkeleton() {
  return (
    <div className="py-8 container mx-auto max-w-[1280px]">
      <div className="h-9 w-72 bg-ink-100 rounded mb-2 animate-pulse" />
      <div className="h-4 w-96 bg-ink-100 rounded mb-6 animate-pulse" />
      <div className="bg-ink-100 rounded-2xl h-[700px] animate-pulse" />
    </div>
  );
}

// ---- Date helpers ---- //

function buildMonthGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  // JS getDay: 0=Sunday..6=Saturday. We want Monday=0..Sunday=6.
  const leadingBlanks = (firstDay.getDay() + 6) % 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function groupEventsByDay(events: any[], year: number, month: number) {
  const map = new Map<number, any[]>();
  for (const event of events) {
    if (!event.eventStartDateTime) continue;
    const start = new Date(event.eventStartDateTime);
    if (start.getFullYear() === year && start.getMonth() + 1 === month) {
      const day = start.getDate();
      const bucket = map.get(day);
      if (bucket) bucket.push(event);
      else map.set(day, [event]);
    }
  }
  return map;
}

function previousMonth(year: number, month: number) {
  if (month === 1) return {year: year - 1, month: 12};
  return {year, month: month - 1};
}

function nextMonth(year: number, month: number) {
  if (month === 12) return {year: year + 1, month: 1};
  return {year, month: month + 1};
}

function formatHHmm(iso: string | Date): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
