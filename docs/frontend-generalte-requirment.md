# Project Brief: VANTAGE Ticketing System

## 1. Project Overview
**VANTAGE** is a high-fidelity, minimalist ticketing platform designed to bridge the gap between event organizers (B2B), ticket buyers (B2C), and event staff. The system is built on a "zero-friction" philosophy, notably omitting traditional email delivery in favor of device-persistent storage and secure PIN recovery.

## 2. Design Vision: "Obsidian Flux"
*   **Aesthetic:** Brutalist-minimalist, premium, high-contrast.
*   **Color Palette:** Deep charcoals (#131313) and blacks, with a vibrant violet/neon accent (#8b5cf6) for primary Call-to-Actions (CTAs).
*   **Typography:** Clean, sans-serif (Inter/Geist) with monospace accents for data/codes.
*   **Core Principle:** "Less is more." Elimination of decorative clutter to prioritize conversion and utility.

## 3. User Experiences & Key Vistas

### 3.1. Buyer Experience (B2C - Desktop/Mobile)
*   **Event Landing Page:** High-impact hero section with event details and a clear inventory of ticketing tiers (Early Bird, General, VIP) showing stock status.
*   **Checkout & Reservation:** A conversion-optimized flow featuring a prominent 10-minute countdown timer to create urgency and secure ticket locks.
*   **Digital Ticket / Success Page:**
    *   **Recovery PIN:** A critical security feature allowing users to recover tickets without email.
    *   **Ticket Carousel:** Supports multi-ticket orders with interactive navigation (Ticket X of N).
    *   **Anonymous Ticketing:** QR codes are "to the bearer" for ease of transfer.

### 3.2. Organizer Experience (B2B - Desktop)
*   **Professional Dashboard:** High-level metrics (Total Sold, Revenue, Active Events) and a functional roster for event management.
*   **Event Creator:** Dynamic form for defining event details and complex ticketing tiers with variable pricing and capacity.
*   **Integrations:** Simplified setup for external automation via Webhook URLs.

### 3.3. Staff Experience (Mobile-first)
*   **QR Scanner:** Optimized for low-light event environments. Features an 80% camera view and high-visibility status alerts (Access Granted, Invalid, Already Used).

## 4. Technical Constraints & Logic
*   **Persistence:** Tickets are saved to local device storage.
*   **Recovery:** A 6-character alphanumeric PIN (e.g., X7B9K2) combined with email is required for cross-device access.
*   **Scalability:** The architecture supports multi-tenant event management with real-time inventory tracking.

## 5. Design Assets
*   **Logo:** Minimalist square scan-code icon.
*   **UI Components:** Dark-mode optimized navbars, sidebars, and custom card patterns with subtle border treatments.