# Frontend - מערכת גבאי בית כנסת

אפליקציית Angular בעברית (RTL) לניהול כספים של בית כנסת עבור גבאים:

- התחברות דרך שם משתמש וסיסמה
- דאשבורד כספים: הכנסות, הוצאות, תרומות, קבלות וחובות
- מעקב שמות מתפללים לפי סטטוס תשלום
- סינון רשומות לפי חיפוש, סוג וסטטוס
- תמיכה ב-PWA (Installable Web App)
- פורטל מנהל נסתר לניהול גבאים (הוספה/מחיקה)
- התראות דפדפן/מכשיר עבור תזכורות גבייה ושמירה מוצלחת

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

> ב-Production האפליקציה נרשמת כ-Service Worker ונטענת כ-PWA.

## פורטל מנהל (סודי)

- כתובת: `/m-root-admin/login`
- התחברות מנהל מבוצעת מול ה-API בנתיב `POST /api/admin/login`
- פרטי מנהל מוגדרים בקובץ [appsettings.json](../backend/TaskFlow.API/appsettings.json) תחת `AdminPortal`

## PWA והתקנה לטלפון

- ניתן להתקין את האפליקציה ישירות מהדפדפן (ללא חנות) דרך כפתור "התקנה לטלפון" בדאשבורד.
- לאחר התקנה, האפליקציה נפתחת במצב עצמאי (Standalone) כמו אפליקציה רגילה.
- להפעלת התראות יש ללחוץ בדאשבורד על "הפעלת התראות" ולאשר הרשאה בדפדפן.
- התראות עובדות רק ב-HTTPS או ב-`localhost` בזמן פיתוח.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
