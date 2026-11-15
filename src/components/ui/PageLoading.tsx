import { Loading, Skeleton } from "../../ui";
import { useI18n } from "../../contexts/I18nContext";

// Пока грузится код страницы внутри макета (шапка и меню уже на месте): заголовок и пара карточек.
// После старта код вкладок подгружается в фоне (pages/lazyPages.ts), так что обычно этого не видно
export default function PageLoading() {
  const { t } = useI18n();
  return (
    <Loading label={t.loading}>
      <div className="grid gap-4 sm:gap-5">
        <Skeleton className="h-9 w-48 rounded-xl" />
        <Skeleton tone="surface" className="h-44 rounded-4xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton tone="surface" className="h-28 rounded-4xl" />
          <Skeleton tone="surface" className="h-28 rounded-4xl" />
        </div>
      </div>
    </Loading>
  );
}
