# Reservas Email

Reservas Email is a modern, streamlined web application for managing restaurant reservations. It allows customers to book tables easily using just their email, and provides a comprehensive dashboard for administrators to manage reservations and restaurant tables.

## Core Features

-   **Customer Reservation**: A simple form for customers to enter their name, email, and preferred time to reserve a table.
-   **Reservation Review**: Customers can look up their existing reservations using their email address.
-   **Role-Based Admin Dashboard**:
    -   **Admin**: Full control over reservations, tables, and user role management.
    -   **Receptionist**: Manages reservations, assigns tables, and updates table statuses.
    -   **Waiter**: Visualizes the restaurant floor, manages table cleaning statuses, and sees assigned customer information.
-   **Visual Table Management**: A grid-based view of restaurant tables showing their real-time status (Available, Reserved, Occupied, Cleaning).

## Tech Stack

This project is built with a modern, robust tech stack:

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **UI Library**: [React](https://reactjs.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
-   **Backend & Database**: [Firebase](https://firebase.google.com/) (Firestore for database, Firebase Auth for authentication)
-   **Internationalization (i18n)**: [next-intl](https://next-intl.dev/) for English and Spanish language support.
-   **Form Management**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation.
-   **AI Integration**: [Genkit](https://firebase.google.com/docs/genkit) for potential future AI-powered features.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Node.js (v18 or later recommended)
-   npm or yarn
-   A Firebase project. You will need to get your Firebase configuration keys.

### Installation

1.  **Clone the repository**:
    ```sh
    git clone https://github.com/xdeleon04/reservas-email.git
    cd reservas-email
    ```

2.  **Install NPM packages**:
    ```sh
    npm install
    ```

3.  **Set up environment variables**:
    Create a `.env.local` file in the root of your project and add your Firebase configuration:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```
    
4.  **Deploy Firestore Rules**:
    Deploy the security rules located in `firestore.rules` to your Firebase project using the Firebase CLI:
    ```sh
    firebase deploy --only firestore:rules
    ```

### Running the App

To run the development server:

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Security: Setting User Roles

This application uses Firebase Custom Claims to manage user roles (`admin`, `receptionist`, `waiter`). These roles must be set from a trusted server environment using the Firebase Admin SDK. **They cannot be set from the client-side app.**

Here is an example Node.js script to assign a role to a user.

1.  **Set up the Admin script**:
    -   Create a folder outside your app project (e.g., `admin-scripts`).
    -   Run `npm init -y` and `npm install firebase-admin`.
    -   Download your Firebase project's service account key (a JSON file) from the Firebase Console (`Project settings` > `Service accounts`) and place it in this folder.

2.  **Create a script (`set-role.js`)**:

    ```javascript
    // set-role.js
    const admin = require('firebase-admin');
    // IMPORTANT: Replace with the path to your service account key
    const serviceAccount = require('./path-to-your-service-account-key.json');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    const userEmail = 'user@example.com'; // The email of the user to modify
    const targetRole = 'admin'; // The role to assign: 'admin', 'receptionist', or 'waiter'

    async function setCustomRole(email, role) {
      try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(user.uid, { role: role });
        console.log(`Success! Custom claim '${role}' set for user ${email}`);
        process.exit(0);
      } catch (error) {
        console.error('Error setting custom claim:', error);
        process.exit(1);
      }
    }

    setCustomRole(userEmail, targetRole);
    ```

3.  **Run the script**:
    ```sh
    node set-role.js
    ```
    After running, the user will have their new role the next time they log in or their token is refreshed.

## Available Scripts

In the project directory, you can run:

-   `npm run dev`: Runs the app in development mode.
-   `npm run build`: Builds the app for production.
-   `npm run start`: Starts a production server.
-   `npm run lint`: Lints the code using Next.js's built-in ESLint configuration.
