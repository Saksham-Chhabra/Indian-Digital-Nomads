Run this command to initialize skills in the backend:- 

      npx ts-node prisma/seed.ts

# 🚀 LocalGigs: Hyperlocal Student Freelancing Marketplace

LocalGigs is a hyperlocal freelancing platform built specifically for **college students**. It connects local clients with verified student talent through a tiered agency system, unlimited video discovery, and a secure, phase-based payment structure.

## 🛠️ Technology Stack

* **Frontend**: Next.js (React) + **Redux** (Global State, Location & Job Feed Management) + Tailwind CSS.
* **Backend**: Node.js (Express) hosted on **Hostinger**.
* **Database**: **PostgreSQL** with PostGIS for geographic indexing and base-location matching.
* **Real-time**: Socket.io for notifications, signaling, and instant job alerts.
* **Video**: **WebRTC / Mediasoup SFU** for unlimited 1-on-1 discovery calls.
* **DevOps**: **Docker Compose** for local and production environment standardization.

---

## 💎 Core Features

### 1. Verified Student Agency Model (Cap: 3)
* **Exclusive Membership**: Students can belong to only **one** agency at a time to prevent fraudulent reach expansion.
* **Invitation System**: Agencies are formed by inviting users via username/email; all members must "Accept" to formalize the group.
* **Student Verification**: Students must upload a **Student ID** during signup. Verified college names are displayed on profiles to build client trust.
* **Visibility Radius (Base Location)**:
    * **Individual Student**: 11km.
    * **2-Person Agency**: 25km.
    * **3-Person Agency**: 35km.

### 2. Selection & Discovery
* **Unlimited Discovery Calls**: Clients and students can engage in 1-on-1 video calls with **no time limits** to discuss project scope.
* **Contract Negotiation**: During the video call, parties negotiate **2–4 phases** for the project. These details are codified into a digital contract signed by both parties before work starts.
* **Client Authority**: While the algorithm ranks the best-value bids, the client has the final authority to choose who to hire.

### 3. Secure Phase-Based Payments (Escrow)
* **Phase Splits**: Long projects are divided into 2–4 phases (e.g., 25% of work per phase) to ensure students are paid for progress.
* **Escrow Logic**: Clients deposit funds for the active phase into the **Company Account** upfront.
* **Approval & Dispute**: Funds are released upon client approval. A **Manual Dispute Button** allows for admin intervention if a client unfairly withholds approval.
* **Flexible Payouts**: By default, earnings go to the Agency Leader’s account, but the agency can switch the payout recipient to any teammate for specific projects.

### 4. Job Feed & Modes
* **Search Modes**: Users can toggle between "Individual Only" and "Agency Mode" jobs.
* **Dynamic Reach**: Clients can manually expand the project radius if no suitable local students are found.
* **Redux Persistence**: The active job feed and user location are stored in Redux to allow for fast, near-instant filtering on the UI.

---

## 🧮 Algorithms

### A. Matching Score (Internal Ranking)
The system ranks candidates based on their suitability for the gig:
$$Score = (Skill Match \times 0.40) + (Distance \times 0.30) + (Historical Rating \times 0.30)$$

### B. Quotation Ranking (Client View)
Proposals are ordered to help clients identify the best value:
$$Rank = (Affordability \times 0.50) + (Quality \times 0.50)$$
* *Quality is derived from the student's rating and total successful phase completions.*

---

## 🐳 Docker Deployment
The project uses `docker-compose` to manage the environment on Hostinger:
* **API Container**: Node.js Express server.
* **DB Container**: PostgreSQL 15+ with PostGIS.
* **Signaling/Cache**: Redis for real-time state management.