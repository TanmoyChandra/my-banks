# My Banks - Functional Specification & Features

## 1. Overview
**My Banks** is a mobile application designed to function as a personal digital wallet and financial organizer. It enables users to securely store, manage, and access their banking-related information—such as UPI IDs, credit/debit cards, and bank accounts—directly on their mobile device. 

## 2. Core Architecture & Infrastructure
- **Framework**: Built using React Native and the Expo framework for cross-platform (iOS and Android) support.
- **Data Persistence**: All user data is stored entirely on the local device using `AsyncStorage`. There is no external backend or database, ensuring data privacy.
- **State Management**: Uses a centralized state store to handle real-time UI updates when adding, editing, or deleting records.
- **First-Time User Flow**: Implements a one-time welcome banner for new users, tracked via a local storage flag.

## 3. Module Breakdown

### 3.1. UPI / QR Management
This module handles digital payment identities.
- **Store UPI IDs**: Users can save and label multiple UPI virtual payment addresses (VPAs).
- **QR Code Scanning**: Uses device camera integration to scan physical QR codes in real-time.
- **Gallery Import**: Users can upload saved screenshots or images from their device gallery; the app automatically parses and extracts the QR data from the image.
- **Full CRUD Support**: Users have the ability to Add, Update, and Delete UPI/QR entries.

### 3.2. Card Management (Debit & Credit Cards)
This module organizes payment cards securely.
- **Data Stored**: Saves Cardholder Name, Card Number, Expiry Date (Valid Thru), and CVV.
- **Interactive Security (Masking)**: 
  - By default, the CVV number is masked (displayed as `***`) to prevent shoulder surfing.
  - The CVV features a tap-to-toggle mechanism: tapping the masked text reveals the CVV, and tapping it again hides it.
- **Quick Copy Functionality**: Individual, dedicated "Copy" actions are available for every specific card detail. A user can tap to instantly copy the exact Name, Card Number, Expiry Date, or CVV to their clipboard without copying unnecessary formatting.
- **Dynamic Network Recognition**: Automatically analyzes the prefix of the card number to identify and display the correct card network (e.g., MasterCard, RuPay).
- **Full CRUD Support**: Users can Add, Update, and Delete card records.

### 3.3. Bank Account Management
This module keeps track of traditional bank account details.
- **Data Stored**: Stores critical account information, typically including the Account Holder Name, Bank Name, Account Number, and IFSC Code.
- **Full CRUD Support**: Users can Add, Update, and Delete specific bank account records as needed.

## 4. Navigation & Accessibility
- **Bottom Navigation**: The primary navigation utilizes a bottom tab bar to quickly switch contexts between the "UPI / QR", "Cards", and "Accounts" views.
- **Drawer Panel**: A hidden side-drawer menu is available for accessing deeper app settings, broader navigation options, or additional information.
