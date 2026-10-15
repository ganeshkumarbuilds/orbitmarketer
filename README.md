# OrbitMarketer 🚀

### Brand-Consistent Campaign Engine

OrbitMarketer is an AI-powered marketing platform that helps teams generate
brand-aware campaigns, check selected compliance risks, identify potentially
duplicated content, and experiment with alternative campaign variants.

## Features

### 1. Brand Brain
- Upload PDF brand guidelines.
- Extract text and candidate brand rules.
- Store brand documents in Firebase Firestore.
- Reference brand rules during campaign generation.

### 2. Campaign Generator
Generate five types of marketing assets:
- Hooks
- Reel scripts
- Advertisements
- Emails
- Landing-page sections

Each asset receives a creative angle:
- Authority
- Urgency
- Curiosity
- Proof
- Fear-to-relief

The application validates generated content and provides a deterministic
fallback when the configured free AI model is unavailable.

### 3. Compliance Checks
- Detect selected guaranteed-result claims.
- Detect selected medical claims.
- Check explicitly prohibited brand phrases.
- Filter selected unsafe instructions in brand rules.
- Detect repetitive content.
- Rewrite selected risky sentences.

These automated checks are limited and do not replace human review.

### 4. Embedding-Based Deduplication
- Generate text embeddings through OpenRouter.
- Calculate cosine similarity between campaign assets.
- Identify potential near-duplicates using a similarity threshold.
- Review candidates before removal.

### 5. A/B/C Experiment Engine
Create three campaign variants:
- A: Control
- B: Clarity-led
- C: Alternative hook

Record impressions, clicks, and conversions.

The optimization utility validates metrics, enforces a minimum impression
threshold before identifying a winner, and recommends a budget allocation.

Budget recommendations use a simple heuristic and are not proof of
statistical significance.

### 6. Firebase Persistence
Firebase Authentication and Cloud Firestore provide authentication and
data persistence. Firestore security rules should restrict access to
authenticated users' own documents.

## Technology Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Firebase Authentication
- Cloud Firestore
- OpenRouter API
- Zod

## Local Setup

### Prerequisites
Install Node.js and npm. You also need a Firebase project and an OpenRouter
API key.

### Install dependencies

```bash
npm install