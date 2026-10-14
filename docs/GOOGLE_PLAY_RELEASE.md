# Подготовка Subly к Google Play

Статус: код подготовлен к проверке выпуска. Android-пакет изменён на com.subly.smartfinance согласно выбору владельца; приложение устанавливается отдельно от прежнего com.subly.app. Подписанный AAB и тестирование на устройстве ещё не выполнены. Публикация не произведена.

## 1. Идентификатор и версия

Новое приложение: `com.subly.smartfinance`, отображаемое название Subly. Android Gradle и Expo теперь используют одинаковый идентификатор. Перед первой загрузкой подтвердите, что этот идентификатор подходит: после публикации смена идентификатора означает другое приложение.

Версия интерфейса: 1.0.0. Для EAS включены удалённый versionCode и autoIncrement. Target/compile SDK: 36. Для каждого нового AAB требуется новый versionCode. Native-папка android входит в Git, поэтому изменение app.json не заменяет ручную проверку Gradle и Manifest.

## 2. Подготовьте Supabase

1. Откройте свой проект Supabase. Убедитесь, что это именно проект из EXPO_PUBLIC_SUPABASE_URL.
2. Для новой пустой базы выполните `supabase/migrations/001_initial_schema.sql` в SQL Editor **один раз**. Не запускайте начальную схему повторно в существующей базе.
3. Примените `supabase/migrations/002_release_constraints.sql` после проверки существующих данных. Скрипт не пересчитывает старые валюты/цены.
4. Убедитесь, что RLS включён на profiles, trials и notification_preferences. Два разных тестовых пользователя не должны видеть/менять записи друг друга. Проверка анонимного чтения не заменяет проверку двух пользователей.
5. Разверните Edge Function `delete-account`: `npx supabase login`, `npx supabase link --project-ref YOUR_PROJECT_REF`, затем `npx supabase functions deploy delete-account`. В облачной функции Supabase предоставляет служебные переменные. Никогда не помещайте service_role в EXPO_PUBLIC_* или в мобильный код.
6. Проверьте на отдельном тестовом аккаунте: удаление из приложения должно удалить пользователя в Authentication и его строки из всех трёх таблиц. Вызов без токена обязан вернуть 401. Код проверяет токен и не принимает ID удаляемого пользователя из тела запроса.
7. В Authentication > URL Configuration добавьте redirect URLs `subly://auth/callback` и `subly://reset-password`. Email confirmation и Google OAuth должны быть настроены в самом Supabase. Для Google требуется правильный callback Supabase в Google Cloud Console.
8. Проверьте регистрацию, подтверждение почты, вход, выход и recovery на том же устройстве, где запросили письмо: PKCE требует сохранённого verifier. Настройте рабочую SMTP-доставку и ограничения паролей не менее 8 символов.

## 3. Действительные контакты и документы

Укажите реальное название владельца приложения и рабочий support email. Замените [OWNER_NAME] и [SUPPORT_EMAIL] в трёх документах. Уточните фактический срок хранения резервных копий/логов.

Опубликуйте доступные по HTTPS страницы Privacy Policy, Terms и Account Deletion. Для внешнего удаления должна работать инструкция обращения в реально обслуживаемую почту. В Google Play ссылка удаления обязательна для приложения с созданием аккаунта.

Если используете GitHub Pages, в репозитории Settings > Pages выберите опубликованную ветку и папку /docs. Файлы privacy.html, terms.html и account-deletion.html готовы как черновики; после правки Markdown обновите HTML командой `node scripts/render-legal.cjs`. Не публикуйте документы с незаполненными полями.

Добавьте в .env и в production environment Expo:

- EXPO_PUBLIC_SUPPORT_EMAIL
- EXPO_PUBLIC_PRIVACY_URL
- EXPO_PUBLIC_TERMS_URL
- EXPO_PUBLIC_DELETION_URL

Supabase URL и anon key уже есть в настройках проекта. Expo owner и EAS projectId сохранены согласно подтверждению владельца, что проекты переданы. Проверьте доступ через `npx eas-cli whoami` и `npx eas-cli project:info`.

## 4. Проверки кода

```
npm ci
npm run typecheck
npm test
npm run check:release
npx expo export --platform android --output-dir dist-audit
```

check:release намеренно завершится с ошибкой, пока контакты и ссылки не заполнены. Успешная проверка не доказывает, что live backend, HTTPS-страницы и подпись работают.

В текущей проверке прошли TypeScript и 9 регрессионных тестов, экспорт JavaScript для Android и web. Нативная сборка AAB, проверки на устройстве и подключённой базе пока не выполнены.

## 5. Соберите APK для устройства, затем AAB

1. Войдите в свой Expo: `npx eas-cli login`.
2. Выполните `npx eas-cli project:info`, проверьте название проекта и owner.
3. Настройте upload key через `npx eas-cli credentials --platform android`. Сохраните резервную копию ключа и его паролей вне Git. Для нового приложения выберите Play App Signing в Google Play.
4. Соберите тестовый APK: `npx eas-cli build --platform android --profile preview`.
5. Установите APK и пройдите проверки ниже.
6. Соберите production AAB: `npx eas-cli build --platform android --profile production`.
7. Убедитесь, что AAB подписан upload key, а не androiddebugkey. Нативная release-конфигурация больше не ссылается на debug signing. EAS должен внедрить ваши credentials. Для локальной сборки задайте SUBLY_UPLOAD_STORE_FILE, SUBLY_UPLOAD_STORE_PASSWORD, SUBLY_UPLOAD_KEY_ALIAS, SUBLY_UPLOAD_KEY_PASSWORD вне репозитория.

Для local Gradle нужны Android SDK 36, совместимый JDK и зависимости SDK/NDK. Они в текущей среде не настроены; нативная сборка здесь не подтверждена.

## 6. Проверки на устройстве

- Первый запуск: заставка заканчивается, onboarding открывается один раз.
- Регистрация, подтверждение почты, вход по паролю, Google sign-in, recovery и установка нового пароля.
- Создание/редактирование/удаление записи; 19,99 сохраняется как 19.99.
- Смешанные валюты показываются отдельными суммами; конвертация не выполняется.
- Проверка дат в Южной Африке и в часовом поясе западнее UTC.
- Напоминания при разрешённых/запрещённых системных уведомлениях; изменение переключателей перепланирует их.
- Нажатие на напоминание открывает соответствующую запись при открытом приложении и после холодного запуска.
- После выхода уведомления на этом устройстве очищены; после нового входа/загрузки планируются снова.
- Отмена у провайдера выполняется пользователем, Subly только сохраняет отметку.
- Полное удаление аккаунта и его данных проверяется и в приложении, и в Supabase.
- Два пользователя не видят данные друг друга.
- Ошибка сети показывает сообщение, а не пустую сводку с обещанием защиты.
- Закрытие/открытие, поворот, большой системный шрифт, Android Back в диалогах, батарея/экономия энергии, перезагрузка телефона.

## 7. Google Play Console

Создайте новое приложение, основной язык English, название Subly. Используйте черновик STORE_LISTING.md. Иконка assets/play-store-icon.png имеет размер 512×512. Старый assets/play-store-feature-graphic.png имеет размер 1024×500, но содержит неподтверждённые обещания «Never get charged» и «30+»; НЕ загружайте его без замены текста. Реальные скриншоты снимите с итогового APK. Скриншотов в этом пакете нет.

Заполните App access рабочим отдельным тестовым логином без доступа к реальным данным. Заполните Ads, Content rating, Target audience и Data safety по фактическому поведению приложения и провайдеров. Черновик DATA_SAFETY.md требует проверки оператора, не копируйте неподтверждённые ответы.

Загрузите AAB в Internal testing, изучите Pre-launch report. Если аккаунт относится к новым личным аккаунтам с соответствующим требованием, нужно закрытое тестирование минимум с 12 непрерывно подключёнными тестировщиками 14 дней и заявка на production access. Проверяйте требование в своей Play Console; оно не универсально для всех аккаунтов.

## Официальные источники

- Target API: https://support.google.com/googleplay/android-developer/answer/11926878
- Account deletion: https://support.google.com/googleplay/android-developer/answer/13327111
- User data: https://support.google.com/googleplay/android-developer/answer/10144311
- Personal-account testing: https://support.google.com/googleplay/android-developer/answer/14151465
- EAS credentials: https://docs.expo.dev/app-signing/managed-credentials/
- Supabase admin deletion: https://supabase.com/docs/reference/javascript/auth-admin-deleteuser

## Firebase: текущий этап

Файл android/app/google-services.json относится к проекту firestore-lesson-f820f и пакету com.subly.smartfinance. Добавлены Google Services 4.5.0 и Firebase BoM 34.17.0 с Analytics и Remote Config. Сбор Analytics отключён в Manifest. Само добавление SDK не реализует каталог офферов, WebView, передачу рекламных идентификаторов или чтение параметра settings в React Native; эти функции ещё отсутствуют. Регистрация по email удалена, вход существующих пользователей и Google сохранены.
