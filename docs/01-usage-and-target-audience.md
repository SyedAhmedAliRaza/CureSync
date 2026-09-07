# CureSync — App Usage Guide & Target Audience

## What is CureSync?

CureSync is an AI-powered medication management web application designed to help users safely manage their medications, check for drug interactions, scan prescriptions using OCR, and get AI-powered health information — all from a single, easy-to-use interface.

The app name "CureSync" reflects its mission: synchronizing your medication routine with intelligent, personalized health insights.


## Core Features

### 1. Drug Interaction Checker
- **What it does**: Users add 2 or more medications and the system checks for known drug-drug interactions using a local drug database, then provides an AI-enhanced risk analysis.
- **How to use**: Navigate to "Interactions" from the navbar. Type medication names in the search box, select from autocomplete suggestions, and click "Check Interactions". The system displays severity levels (high/medium/low), symptoms to watch for, and practical recommendations.
- **Key detail**: If a high-severity interaction is detected, an animated emergency alert banner is displayed.

### 2. AI Health Assistant (Chat)
- **What it does**: A conversational AI chatbot powered by Alibaba Cloud's Qwen LLM that answers medication-related questions only. It refuses off-topic queries to maintain focus and safety.
- **How to use**: Navigate to "Chat" from the navbar. Type any medication question (e.g., "What are the side effects of Metformin?"). The AI responds with patient-friendly information and always recommends consulting a healthcare professional.
- **Key detail**: Supports conversation history, session management (multiple chat threads), and multilingual responses (English, Balochi, Sindhi, Pashto, Punjabi).

### 3. Prescription Scanner (OCR)
- **What it does**: Users upload a photo of a handwritten or printed prescription. The system uses AI-powered OCR (Qwen-VL vision model) to extract text, then parses it into structured medication entries that can be added directly to the user's medication schedule.
- **How to use**: Navigate to "Scan" from the navbar. Upload or drag-and-drop a prescription image (JPG/PNG). Click "Scan Prescription". Review the extracted medications and click "Add to Schedule" for each one.
- **Key detail**: Shows confidence levels (high/medium/low) for each detected medication, so users can verify accuracy.

### 4. Medication Schedule
- **What it does**: A personal medication tracker where users can add, view, manage, and deactivate their medications with dosage, frequency, and reminder times.
- **How to use**: Navigate to "Schedule" from the navbar. Click "Add Medication", search for a drug or type a name, fill in dosage/frequency/times, and submit. Medications can be deactivated or deleted.
- **Key detail**: Medications have active/inactive states for easy management. Users can edit medication names inline after selecting from the drug search.

### 5. Multilingual Support
- **What it does**: The entire app interface and AI responses can be switched between English and four regional languages: Balochi, Sindhi, Pashto, and Punjabi.
- **How to use**: Click the language selector in the navbar to switch languages. AI responses automatically adapt to the selected language while keeping medicine names in English for accuracy.

### 6. Dark / Light Mode
- **What it does**: Full theme support with system-preference detection and manual toggle.
- **How to use**: Click the sun/moon icon in the navbar to toggle between light and dark themes.


## Target Audience

### Primary Audience
1. **Elderly patients (60+)** managing multiple daily medications who need a simple tool to track their schedule and avoid dangerous drug interactions. The large, clear UI and intuitive navigation make it accessible.

2. **Adult patients (25-60)** on chronic medication regimens who want to understand potential interactions between their prescriptions and over-the-counter drugs.

3. **Caregivers and family members** managing medications on behalf of elderly relatives or dependents, who need a centralized view of all medications and potential risks.

### Secondary Audience
4. **Medical and pharmacy students** who want a quick reference tool for drug interactions and medication information during their studies or clinical rotations.

5. **Community health workers** in underserved or rural areas (especially in multilingual regions) who need a portable, accessible medication reference that works in local languages.

6. **Healthcare professionals** (doctors, pharmacists) looking for a quick secondary check on drug interactions before prescribing or dispensing medications.

### Geographic Focus
- The multilingual support (Balochi, Sindhi, Pashto, Punjabi) specifically targets populations in Pakistan, Afghanistan, and surrounding regions where access to digital health tools in local languages is limited.
- The app uses Alibaba Cloud's international DashScope API (Singapore endpoint), making it suitable for Asia-Pacific deployment.


## Use Cases

| Scenario | Feature Used | Outcome |
|---|---|---|
| Patient takes Aspirin + Warfarin | Interaction Checker | High-severity bleeding risk alert displayed |
| User unsure about side effects | AI Chat | Gets clear, patient-friendly explanation |
| Doctor gives printed prescription | Prescription Scanner | Extracts meds from photo, adds to schedule |
| Elderly user needs simplicity | Schedule + Scanner | Adds meds via prescription photo instead of manual typing |
| Non-English speaker needs info | Language Switcher | AI responds in Pashto/Punjabi/Sindhi/Balochi |
| Checking new prescription against existing meds | Interactions + Schedule | Cross-references all current medications |


## Safety & Disclaimers

CureSync is designed as an **informational tool**, not a replacement for professional medical advice. The app:
- Always recommends consulting a doctor or pharmacist for medical decisions
- Displays emergency alerts for high-severity interactions
- Clearly states it is NOT a substitute for professional medical advice
- Advises calling emergency services for urgent situations
- Operates in offline mode with reduced functionality if AI services are unavailable
