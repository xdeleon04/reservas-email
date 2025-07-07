
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
    Create a `.env.local` file in the root of your project and add your Firebase configuration.

    **Client-Side Keys:**
    Add your Firebase configuration for the client app:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```

    **Server-Side Keys (for Admin SDK):**
    To enable admin functionalities like user management, you need to provide server-side credentials from your Firebase project's service account.

    1.  In the Firebase Console, go to **Project settings** > **Service accounts**.
    2.  Select your project, and click **Generate new private key**. A JSON file containing your service account credentials will be downloaded.
    3.  Open the JSON file and copy the values into your `.env.local` file as shown below:

    ```env
    # From your service account JSON file
    FIREBASE_PROJECT_ID="your-project-id"
    FIREBASE_CLIENT_EMAIL="firebase-adminsdk-..."
    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...your...private...key...\n-----END PRIVATE KEY-----\n"
    ```
    **Important:** For `FIREBASE_PRIVATE_KEY`, you must wrap the entire key, including the `-----BEGIN...` and `-----END...` lines, in double quotes (`"`). Replace all literal newlines within the key with the `\n` character.
    
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

User roles (`admin`, `receptionist`, `waiter`) are managed via Firebase Custom Claims. For the app's role-based features to work, you must have your Admin SDK credentials set up in your `.env.local` file (see "Set up environment variables").

### Initial Admin Setup (Required)

Initially, no user has an `admin` role. You **must** use a command-line script to assign the `admin` role to the first user. This user must have already signed up for an account in your application.

1.  **Sign Up First**: Run the app and create a new staff account for the user you want to make an administrator.

2.  **Run the Role-Assignment Script**: From your project's root directory, run the following command, replacing the email and role with your desired values:

    ```sh
    node admin-scripts/set-role.js your-admin-email@example.com admin
    ```

    If successful, the script will confirm the role has been assigned. The user can now log in and access the Admin Dashboard.

### Managing Roles in the App

Once you have an administrator account, you can manage all other user roles directly within the application:

1.  Log in as a user with the `admin` role.
2.  Navigate to the **Admin > Users** tab.
3.  From here, you can assign or change the roles for any user who has signed up.

The script can also be used to assign other roles from the command line:
```sh
# Assign a receptionist role
node admin-scripts/set-role.js user@example.com receptionist

# Assign a waiter role
node admin-scripts/set-role.js user@example.com waiter
```

### Seeding the Database (Optional)

To quickly populate your application with sample data for tables and menu items, you can run the seed script. This is useful for development and testing purposes.

**Note:** The script will only add data if the `tables` and `menuItems` collections in your Firestore are empty.

1.  Make sure your `.env.local` file is correctly configured with your Firebase Admin credentials.
2.  Run the following command from your project's root directory:
    ```sh
    npm run db:seed
    ```
    This will add a variety of restaurant tables and a sample menu to your database.

## Available Scripts

In the project directory, you can run:

-   `npm run dev`: Runs the app in development mode.
-   `npm run build`: Builds the app for production.
-   `npm run start`: Starts a production server.
-   `npm run lint`: Lints the code using Next.js's built-in ESLint configuration.
-   `npm run db:seed`: Populates the database with sample tables and menu items.

