import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Отказ от ответственности — ElectroPlan',
}

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <h1 className="text-2xl sm:text-3xl font-bold font-display mb-8">
        Отказ от ответственности
      </h1>

      <div className="space-y-6 text-sm sm:text-base text-text-secondary leading-relaxed">
        {/* 1 */}
        <section className="rounded-xl border border-border bg-bg-elevated p-5 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-text-primary mb-3">
            1. Информационный характер
          </h2>
          <p>
            Все расчёты, схемы и рекомендации, представленные на сайте{' '}
            <strong className="text-text-primary">ElectroPlan</strong> (electro.asod.su),
            носят <strong className="text-text-primary">исключительно ознакомительный и справочный характер</strong>.
            Сервис предоставляется «как есть» (as is), без каких-либо явных или подразумеваемых гарантий
            полноты, точности, актуальности или пригодности результатов расчётов для конкретных целей.
          </p>
        </section>

        {/* 2 */}
        <section className="rounded-xl border border-border bg-bg-elevated p-5 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-text-primary mb-3">
            2. Нормативная база
          </h2>
          <p>
            Расчёты основаны на методиках и нормативах, действовавших на дату последнего обновления сайта:
          </p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Правила устройства электроустановок (ПУЭ, 7-е издание);</li>
            <li>ГОСТ Р 50571.3-2009 (МЭК 60364-4-41:2005);</li>
            <li>СП 256.1325800.2016 «Электроустановки жилых и общественных зданий»;</li>
            <li>Иные нормативные документы РФ в области электробезопасности.</li>
          </ul>
          <p className="mt-3">
            Нормативная база может изменяться. Администрация сайта{' '}
            <strong className="text-text-primary">не гарантирует</strong> своевременного обновления
            методик расчёта при изменении законодательства или нормативных требований.
          </p>
        </section>

        {/* 3 */}
        <section className="rounded-xl border border-border bg-bg-elevated p-5 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-text-primary mb-3">
            3. Отсутствие гарантий
          </h2>
          <p>
            Администрация сайта{' '}
            <strong className="text-text-primary">не несёт ответственности</strong> за:
          </p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>
              прямой или косвенный ущерб, возникший в результате использования (или невозможности
              использования) результатов расчётов сервиса;
            </li>
            <li>
              ошибки в подборе оборудования, несоответствие подобранного оборудования
              реальным условиям эксплуатации;
            </li>
            <li>
              последствия монтажа, выполненного на основании расчётов, полученных с
              использованием настоящего сервиса;
            </li>
            <li>
              любой ущерб имуществу, здоровью или жизни третьих лиц, связанный с
              использованием информации, размещённой на Сайте или полученной
              с помощью его инструментов.
            </li>
          </ul>
        </section>

        {/* 4 */}
        <section className="rounded-xl border border-border bg-bg-elevated p-5 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-text-primary mb-3">
            4. Профессиональное проектирование
          </h2>
          <p>
            Настоящий сервис{' '}
            <strong className="text-text-primary">не заменяет профессиональное проектирование</strong>{' '}
            электроустановок. Все расчёты должны быть проверены квалифицированным специалистом
            с учётом конкретных условий объекта, характеристик питающей сети, региональных
            требований энергоснабжающей организации и фактических параметров применяемого
            оборудования.
          </p>
          <p className="mt-2">
            Перед выполнением любых электромонтажных работ настоятельно рекомендуется:
          </p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>согласовать проект и нагрузку с энергоснабжающей организацией;</li>
            <li>получить необходимые допуски и разрешения;</li>
            <li>
              доверить монтаж квалифицированному персоналу, имеющему действующую группу
              допуска по электробезопасности.
            </li>
          </ul>
        </section>

        {/* 5 */}
        <section className="rounded-xl border border-border bg-bg-elevated p-5 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-text-primary mb-3">
            5. Интеллектуальная собственность
          </h2>
          <p>
            Алгоритмы расчёта, программный код, база данных артикулов и каталогов оборудования,
            наименование «ElectroPlan» и все элементы дизайна являются объектами интеллектуальной
            собственности администрации сайта, если иное не указано явно.
          </p>
        </section>

        {/* 6 */}
        <section className="rounded-xl border border-border bg-bg-elevated p-5 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-text-primary mb-3">
            6. Пользовательское соглашение
          </h2>
          <p>
            Используя настоящий сайт и/или его сервисы, вы подтверждаете, что ознакомились
            с настоящим Отказом от ответственности, принимаете его условия в полном объёме
            и обязуетесь их соблюдать.
          </p>
          <p className="mt-2 font-semibold text-text-primary">
            Если вы не согласны с условиями настоящего Отказа — немедленно покиньте сайт.
          </p>
          <p className="mt-2">
            Продолжение использования сайта означает ваше полное и безоговорочное согласие
            со всеми пунктами данного документа.
          </p>
        </section>

        {/* 7 — финалка */}
        <section className="rounded-xl border border-border bg-bg-elevated p-5 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-text-primary mb-3">
            7. Заключительные положения
          </h2>
          <p>
            Администрация оставляет за собой право вносить изменения в настоящий документ
            в одностороннем порядке без предварительного уведомления пользователей.
            Актуальная редакция всегда доступна на данной странице.
          </p>
          <p className="mt-3 text-xs text-text-muted">
            Дата последнего обновления: 15 июля 2026 года.
          </p>
        </section>
      </div>

      {/* Кнопка назад */}
      <div className="mt-10 text-center">
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
        >
          ← Вернуться на главную
        </a>
      </div>
    </div>
  )
}
