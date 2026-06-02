import AnalyticsScriptInjector from './analytics-script-injector';

type Instance = {
  isActive?: boolean | null;
  template?: {
    name?: string | null;
    code?: string | null;
    placement?: string | null;
    loadStrategy?: string | null;
    isActive?: boolean | null;
  } | null;
  valueList?:
    | {
        value?: string | null;
        parameter?: {placeholderKey?: string | null} | null;
      }[]
    | null;
};

function substitute(
  code: string,
  values: NonNullable<Instance['valueList']>,
): string {
  return values.reduce((acc, entry) => {
    const key = entry.parameter?.placeholderKey;
    if (!key) return acc;
    return acc.replaceAll(`{{${key}}}`, entry.value ?? '');
  }, code);
}

export default function AnalyticsScripts({instances}: {instances: Instance[]}) {
  const active = instances.filter(
    inst =>
      inst.isActive === true &&
      inst.template?.isActive === true &&
      inst.template.code,
  );

  return (
    <>
      {active.map((inst, idx) => {
        const template = inst.template!;
        const html = substitute(template.code ?? '', inst.valueList ?? []);
        const slug = (template.name ?? 'untitled')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-');
        const id = `${slug}-${idx}`;
        return <AnalyticsScriptInjector key={id} id={id} html={html} />;
      })}
    </>
  );
}
